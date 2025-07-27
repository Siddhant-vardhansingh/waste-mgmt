from typing import Dict
from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import create_engine, Column, String, DateTime, Float
from sqlalchemy.dialects.mysql import BINARY
from sqlalchemy.orm import sessionmaker, Session, declarative_base
import requests
from fastapi import Header
from uuid import uuid4, UUID
from datetime import datetime

DATABASE_URL = "mysql+pymysql://user:userpass@mysql:3306/waste_mgmt"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Getting Current User
def get_current_user(authorization: str = Header(...)):
    # Expect header: Authorization: Bearer <token>
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split(" ", 1)[1]
    response = requests.get(
        "http://backend-auth:8000/user/me", headers={"Authorization": f"Bearer {token}"}
    )
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid token")
    return response.json()


app = FastAPI(title="Order Service")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Waste order model
class Order(Base):
    __tablename__ = "orders"

    id = Column(BINARY(16), primary_key=True, index=True, default=lambda: uuid4().bytes)
    user_id = Column(BINARY(16))
    user_name = Column(String(255))
    item_type = Column(String(255))
    quantity = Column(Float)
    pickup_date = Column(DateTime)
    order_date = Column(DateTime)
    pickup_address = Column(String(255))


Base.metadata.create_all(bind=engine)


# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Order Service Running"}


@app.get("/items")
def get_items():
    scrap_data = {
        "status": "success",
        "data": {
            "scrap_items": [
                {
                    "category": "Metals",
                    "items": [
                        "Aluminum cans",
                        "Copper wires",
                        "Steel utensils",
                        "Iron rods or tools",
                        "Brass fittings",
                        "Old pressure cookers",
                        "Non-stick pans",
                        "Bicycle parts",
                        "Rusty nails, screws, bolts",
                    ],
                },
                {
                    "category": "Plastics",
                    "items": [
                        "Empty detergent containers",
                        "Shampoo and soap bottles",
                        "Plastic jars and containers",
                        "Old plastic buckets or mugs",
                        "Broken plastic furniture",
                        "PET bottles",
                    ],
                },
                {
                    "category": "Paper Products",
                    "items": [
                        "Newspapers",
                        "Magazines",
                        "Used notebooks",
                        "Cardboard boxes",
                        "Old books",
                        "Paper packaging",
                    ],
                },
                {
                    "category": "Glass Items",
                    "items": [
                        "Broken glass bottles",
                        "Empty sauce or pickle jars",
                        "Old mirrors",
                        "Window panes",
                    ],
                },
                {
                    "category": "Electronics and E-Waste",
                    "items": [
                        "Old mobile phones",
                        "Broken chargers and cables",
                        "Dead batteries",
                        "Defunct TVs and radios",
                        "Old computer parts",
                        "Electric irons",
                        "Tube lights and CFLs",
                    ],
                },
                {
                    "category": "Miscellaneous",
                    "items": [
                        "Broken ceramic plates or tiles",
                        "Discarded footwear",
                        "Old toys",
                        "Used Tupperware",
                        "Broken umbrellas",
                    ],
                },
            ]
        },
    }
    return JSONResponse(scrap_data)


# Endpoint to create a new order
class OrderRequest(BaseModel):
    items: dict[str, float]  # Key: item name, Value: quantity
    pickup_date: datetime
    pickup_address: str


@app.post("/order")
def create_order(
    order: OrderRequest,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user),
):
    user = current_user.get("sub")
    user_id = current_user.get("user_id")
    if not user or not user_id:
        raise HTTPException(status_code=400, detail="User ID not found in token")

    # Convert user_id to bytes for BINARY(16)
    try:
        user_id_bytes = UUID(user_id).bytes
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    created_items = []
    for item_type, quantity in order.items.items():
        if not isinstance(quantity, float) or quantity <= 0:
            raise HTTPException(
                status_code=422, detail=f"Invalid quantity for {item_type}"
            )
        order_entry = Order(
            user_name=user,
            user_id=user_id_bytes,
            item_type=item_type,
            quantity=quantity,
            pickup_date=order.pickup_date,
            order_date=datetime.utcnow(),
            pickup_address=order.pickup_address
        )
        db.add(order_entry)
        db.flush()  # Get order_entry.id before commit
        created_items.append(
            {
                "order_id": str(UUID(bytes=order_entry.id)),
                "item_type": item_type,
                "quantity": quantity,
                "pickup_date": order.pickup_date,
                "order_date": datetime.utcnow(),
                "pickup_address":order.pickup_address
            }
        )
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error")

    return {
        "status": "success",
        "message": "Order created successfully",
        "user_id": user_id,
        "items": created_items,
    }


@app.get("/orders")
def get_orders(
    db: Session = Depends(get_db), current_user: Dict = Depends(get_current_user)
):
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID not found in token")

    try:
        user_id_bytes = UUID(user_id).bytes
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user_id format")

    orders = db.query(Order).filter(Order.user_id == user_id_bytes).all()
    result = []
    for order in orders:
        result.append(
            {
                "order_id": str(UUID(bytes=order.id)),
                "item_type": order.item_type,
                "quantity": order.quantity,
                "pickup_date": order.pickup_date,
                "order_date": order.order_date,
                "user_name": order.user_name,
                "pickup_address": order.pickup_address
            }
        )
    return {"status": "success", "orders": result}
