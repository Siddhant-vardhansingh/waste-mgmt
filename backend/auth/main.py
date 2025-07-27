from fastapi import FastAPI, HTTPException, Depends, status, Body
from pydantic import BaseModel, EmailStr
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String
from sqlalchemy.dialects.mysql import BINARY
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from uuid import uuid4, UUID
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer
from typing import List


# Database setup
DATABASE_URL = "mysql+pymysql://user:userpass@mysql:3306/waste_mgmt"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Create table(s)
Base.metadata.create_all(bind=engine)


class UserResponse(BaseModel):
    user_id: str
    username: str
    email: EmailStr
    gender: str
    mobile: str

    class Config:
        orm_mode = True


class UserUpdate(BaseModel):
    password: str | None = None
    email: EmailStr | None = None
    gender: str | None = None
    mobile: str | None = None


class User(Base):
    __tablename__ = "users"
    id = Column(BINARY(16), primary_key=True, index=True, default=lambda: uuid4().bytes)
    role = Column(String(20), default="user")
    username = Column(String(255), unique=True, index=True)
    password = Column(String(255))
    email = Column(String(255), unique=True)
    gender = Column(String(10))
    mobile = Column(String(15), unique=True)


class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(BINARY(16), primary_key=True, index=True, default=lambda: uuid4().bytes)
    name = Column(String(255), unique=True, index=True)
    role = Column(String(20), default="vendor")
    password = Column(String(255))
    email = Column(String(255), unique=True)
    gender = Column(String(10))
    mobile = Column(String(15), unique=True)
    address = Column(String(255))


class VendorCreate(BaseModel):
    name: str
    password: str
    email: EmailStr
    gender: str
    mobile: str
    address: str


class VendorLogin(BaseModel):
    email: EmailStr
    password: str


class UserCreate(BaseModel):
    username: str
    password: str
    email: EmailStr
    gender: str
    mobile: str


class UserLogin(BaseModel):
    username: str
    password: str


class VendorUpdate(BaseModel):
    password: str | None = None
    email: EmailStr | None = None
    gender: str | None = None
    mobile: str | None = None
    address: str | None = None


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# JWT Token Configurations
SECRET_KEY = "waste_mgmt_project_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# FastAPI instance
app = FastAPI(title="Auth Service")

# CORS setup (adjust `allow_origins` in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Auth Service Running"}


# login endpoint
@app.post("/user/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        if pwd_context.verify(user.password, existing_user.password):
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            to_encode = {
                "sub": existing_user.username,
                "role": existing_user.role,  # Add this
                "exp": expire,
            }
            access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user_id": str(UUID(bytes=existing_user.id)),
                "role": existing_user.role,
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Password is incorrect"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Username doesn't Exist"
        )


# Verify Token
@app.get("/user/me")
def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        payload["user_id"] = str(UUID(bytes=user.id))
        return payload
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# Signup endpoint
@app.post("/user/signup")
def signup_user(user: UserCreate, db: Session = Depends(get_db)):
    existing_user = (
        db.query(User)
        .filter(
            (User.username == user.username)
            | (User.email == user.email)
            | (User.mobile == user.mobile)
        )
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username, email, or mobile number already registered",
        )
    hashed_password = pwd_context.hash(user.password)
    new_user = User(
        username=user.username,
        password=hashed_password,
        email=user.email,
        gender=user.gender,
        mobile=user.mobile,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Convert binary UUID to string for response
    return {
        "message": "User created successfully",
        "user_id": str(UUID(bytes=new_user.id)),
    }


@app.get("/user/users", response_model=List[UserResponse])
def get_all_users(
    db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)
):
    if current_user.get("role") != "support":
        raise HTTPException(status_code=403, detail="Access forbidden")
    users = db.query(User).all()
    return [
        UserResponse(
            user_id=str(UUID(bytes=user.id)),
            username=user.username,
            email=user.email,
            gender=user.gender,
            mobile=user.mobile,
        )
        for user in users
    ]


@app.put("/user/edit")
def edit_user(
    username: str,
    updates: UserUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    # Support can edit any user, normal users can only edit themselves
    is_self = username == current_user.get("sub")
    is_support = current_user.get("role") == "support_user"

    if not (is_self or is_support):
        raise HTTPException(status_code=403, detail="Not authorized to edit this user")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update fields conditionally
    if updates.password:
        user.password = pwd_context.hash(updates.password)

    if updates.email:
        user.email = updates.email

    if updates.gender:
        user.gender = updates.gender

    if updates.mobile:
        user.mobile = updates.mobile

    db.commit()
    db.refresh(user)

    return {
        "message": f"User '{username}' updated successfully",
        "user_id": str(UUID(bytes=user.id)),
        "role": user.role,
    }


@app.post("/vendor/signup")
def signup_vendor(vendor: VendorCreate, db: Session = Depends(get_db)):
    existing_user = (
        db.query(Vendor)
        .filter(
            (Vendor.name == vendor.name)
            | (Vendor.email == vendor.email)
            | (Vendor.mobile == vendor.mobile)
        )
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username, email, or mobile number already registered",
        )
    hashed_password = pwd_context.hash(vendor.password)
    new_user = Vendor(
        name=vendor.name,
        password=hashed_password,
        email=vendor.email,
        gender=vendor.gender,
        mobile=vendor.mobile,
        address=vendor.address,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Convert binary UUID to string for response
    return {
        "message": "Vendor created successfully",
        "user_id": str(UUID(bytes=new_user.id)),
    }


@app.post("/vendor/login")
def login_vendor(vendor: VendorLogin, db: Session = Depends(get_db)):
    existing_user = db.query(Vendor).filter(Vendor.email == vendor.email).first()
    if existing_user:
        if pwd_context.verify(vendor.password, existing_user.password):
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
            to_encode = {"sub": existing_user.email, "exp": expire}
            access_token = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user_id": str(UUID(bytes=existing_user.id)),
                "name": existing_user.name,
                "email": existing_user.email,
                "role": existing_user.role,
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Password is incorrect"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Email doesn't Exist"
        )


# Helper for vendor authentication
def get_current_vendor(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")

        vendor = db.query(Vendor).filter(Vendor.email == email).first()
        if vendor is None:
            raise HTTPException(status_code=404, detail="Vendor not found")

        return {
            "user_id": str(UUID(bytes=vendor.id)),
            "name": vendor.name,
            "email": vendor.email,
            "gender": vendor.gender,
            "mobile": vendor.mobile,
            "address": vendor.address,
            "role": vendor.role,  # Add this line
        }
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# /vendor/me endpoint
@app.get("/vendor/me")
def get_current_vendor_endpoint(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    return get_current_vendor(token, db)


# /vendor/edit endpoint
@app.put("/vendor/edit")
def edit_vendor(
    email: str,
    updates: VendorUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_vendor),
):
    # Support users can edit any vendor, vendors can edit themselves

    is_self = email == current_user["email"]
    is_support = current_user.get("role") == "support_vendor"

    if not (is_self or is_support):
        raise HTTPException(
            status_code=403, detail="Not authorized to edit this vendor"
        )

    vendor = db.query(Vendor).filter(Vendor.email == email).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    # Update fields conditionally
    if updates.password:
        vendor.password = pwd_context.hash(updates.password)

    if updates.email:
        vendor.email = updates.email

    if updates.gender:
        vendor.gender = updates.gender

    if updates.mobile:
        vendor.mobile = updates.mobile

    if updates.address:
        vendor.address = updates.address

    db.commit()
    db.refresh(vendor)

    return {
        "message": f"Vendor '{vendor.name}' updated successfully",
        "user_id": str(UUID(bytes=vendor.id)),
    }
