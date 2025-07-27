import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";

export default function Home() {
  const [isLogin, setIsLogin] = useState(true);
  const [isVendor, setIsVendor] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    gender: "",
    mobile: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState("");
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    username: "",
    password: "",
    email: "",
    mobile: "",
    gender: "",
  });
  const [showEditVendorForm, setShowEditVendorForm] = useState(false);
  const [editVendorFormData, setEditVendorFormData] = useState({
    name: "",
    password: "",
    email: "",
    mobile: "",
    gender: "",
    address: "",
  });
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const storedUserType = localStorage.getItem("userType");
    if (token) {
      setIsLoggedIn(true);
      setUserType(storedUserType || "");
    }
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditVendorFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setEditVendorFormData({
      ...editVendorFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditUser = async () => {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("userType");
      const username = localStorage.getItem("username");
      if (!token) {
        setError("Please login first");
        return;
      }
      if (!username) {
        setError("Username not found");
        return;
      }
      // Only support can edit anyone, regular users can edit themselves
      let formUsername = "";
      if (role === "support_user") {
        formUsername = "";
      } else {
        formUsername = username;
      }
      setShowEditForm(true);
      setEditFormData({
        username: formUsername,
        password: "",
        email: "",
        mobile: "",
        gender: "",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load user data");
    }
  };

  const handleEditVendor = async () => {
    try {
      const token = localStorage.getItem("token");
      const vendorEmail = localStorage.getItem("email");
      const role = localStorage.getItem("userType");
      if (!token) {
        setError("Please login first");
        return;
      }
      if (!vendorEmail) {
        setError("Vendor email not found");
        return;
      }
      // Permission: vendor can edit self, or support_vendor can edit any
      const currentVendorEmail = localStorage.getItem("email");
      const canEdit =
        currentVendorEmail === vendorEmail || role === "support_vendor";
      if (!canEdit) {
        setError("You do not have permission to edit this vendor");
        return;
      }
      setShowEditVendorForm(true);
      // Set name based on role and currentVendorName
      let formEmail = "";
      if (role === "support_vendor") {
        formEmail = "";
      } else if (currentVendorEmail === vendorEmail) {
        formEmail = vendorEmail;
      }
      setEditVendorFormData({
        name: "",
        password: "",
        email: formEmail,
        mobile: "",
        gender: "",
        address: "",
      });
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load vendor data");
    }
  };

  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const currentUsername = localStorage.getItem("username");
      const role = localStorage.getItem("userType");

      // Determine which username to use in query params
      let queryUsername = currentUsername;
      if (role === "support_user") {
        queryUsername = editFormData.username;
      }

      const response = await axios.put(
        `http://localhost:8001/user/edit?username=${queryUsername}`,
        {
          password: editFormData.password,
          email: editFormData.email,
          mobile: editFormData.mobile,
          gender: editFormData.gender,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("User updated:", response.data);
      setError("User updated successfully!");
      setShowEditForm(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update user data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEditVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const currentVendorEmail = localStorage.getItem("email");
      const role = localStorage.getItem("userType");

      // Determine which email to use in query params
      let queryEmail = currentVendorEmail;
      if (role === "support_vendor") {
        queryEmail = editVendorFormData.email;
      }

      const response = await axios.put(
        `http://localhost:8001/vendor/edit?email=${queryEmail}`,
        {
          password: editVendorFormData.password,
          name: editVendorFormData.name,
          mobile: editVendorFormData.mobile,
          gender: editVendorFormData.gender,
          address: editVendorFormData.address,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      console.log("Vendor updated:", response.data);
      setError("Vendor updated successfully!");
      setShowEditVendorForm(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update vendor data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        if (isVendor) {
          // Vendor Login: use email and password
          const response = await axios.post(
            `http://localhost:8001/vendor/login`,
            {
              email: formData.email,
              password: formData.password,
            },
          );
          localStorage.setItem("token", response.data.access_token);
          localStorage.setItem(
            "username",
            response.data.name || formData.username,
          );
          localStorage.setItem("userType", response.data.role);
          localStorage.setItem("email", response.data.email);
          router.push("/dashboard");
        } else {
          // User Login: use username and password
          const response = await axios.post(
            `http://localhost:8001/user/login`,
            {
              username: formData.username,
              password: formData.password,
            },
          );
          localStorage.setItem("token", response.data.access_token);
          localStorage.setItem("username", formData.username);
          localStorage.setItem("userType", response.data.role);
          router.push("/dashboard");
        }
      } else {
        if (isVendor) {
          // Vendor Signup
          const signupData = {
            name: formData.username, // Use 'name' for vendor
            email: formData.email,
            gender: formData.gender,
            mobile: formData.mobile,
            address: formData.address,
            password: formData.password,
          };
          const response = await axios.post(
            `http://localhost:8001/vendor/signup`,
            signupData,
          );
          // No token to store
          setIsLogin(true); // Switch to login form
          setError("Signup successful! Please log in.");
          // Remove router.push("/login") - no such route exists
        } else {
          // User Signup
          const signupData = {
            username: formData.username,
            email: formData.email,
            gender: formData.gender,
            mobile: formData.mobile,
            password: formData.password,
          };
          const response = await axios.post(
            `http://localhost:8001/user/signup`,
            signupData,
          );
          // No token to store
          setIsLogin(true); // Switch to login form
          setError("Signup successful! Please log in.");
          // Remove router.push("/login") - no such route exists
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Bar */}
      <header className="w-full sticky top-0 z-20 bg-white/80 backdrop-blur shadow-md flex flex-col md:flex-row items-center justify-between px-8 py-4 mb-8">
        <div className="flex items-center gap-3">
          <span className="text-green-600 text-3xl">♻️</span>
          <span className="text-2xl font-extrabold text-indigo-700 tracking-tight">
            EcoWaste
          </span>
        </div>
        <div className="mt-2 md:mt-0 text-indigo-600 font-semibold text-lg">
          Empowering a Cleaner Tomorrow
        </div>
      </header>

      {/* Main Content: Two-column layout */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 px-4 w-full max-w-5xl mx-auto">
        {/* Left: Illustration and message */}
        <div className="hidden md:flex flex-col items-center justify-center flex-1 animate-fade-in">
          <div className="bg-gradient-to-br from-green-100 via-blue-100 to-indigo-100 rounded-3xl shadow-xl p-8 flex flex-col items-center border border-indigo-100">
            <span className="text-green-500 text-7xl mb-4">🌱</span>
            <h2 className="text-2xl font-bold text-indigo-800 mb-2 text-center">
              Join the Movement for a Greener Planet
            </h2>
            <p className="text-gray-700 text-center text-lg mb-2">
              Every small step in waste management leads to a cleaner, healthier
              world. Sign up or log in to make a difference today!
            </p>
            <blockquote className="italic text-indigo-600 mt-2 text-center text-base">
              “The Earth is what we all have in common.”
            </blockquote>
          </div>
        </div>
        {/* Right: Auth Card */}
        <div className="flex-1 flex flex-col items-center w-full animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Waste Management
              </h1>
              <p className="text-gray-600">
                {isLogin
                  ? "Welcome back! Please sign in."
                  : "Create your account"}
              </p>
            </div>
            {/* Top Action Buttons */}
            <div className="flex flex-col gap-3 mb-6 animate-fade-in">
              {isLoggedIn && (
                <button
                  onClick={handleGoToDashboard}
                  className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all shadow-lg font-semibold tracking-wide"
                >
                  Dashboard
                </button>
              )}
              {isLoggedIn &&
                (userType === "user" || userType === "support_user") && (
                  <button
                    onClick={handleEditUser}
                    className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-all shadow-lg font-semibold tracking-wide"
                  >
                    Edit User
                  </button>
                )}
              {isLoggedIn &&
                (userType === "vendor" || userType === "support_vendor") && (
                  <button
                    onClick={handleEditVendor}
                    className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-all shadow-lg font-semibold tracking-wide"
                  >
                    Edit Vendor
                  </button>
                )}
            </div>

            {/* User Type Toggle - Large pill with icons */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex rounded-full bg-blue-100 p-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => setIsVendor(false)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                    ${
                      !isVendor
                        ? "bg-blue-600 text-white shadow"
                        : "text-blue-600 hover:bg-blue-200"
                    }`}
                >
                  <span role="img" aria-label="User">
                    👤
                  </span>{" "}
                  User
                </button>
                <button
                  type="button"
                  onClick={() => setIsVendor(true)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full text-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
                    ${
                      isVendor
                        ? "bg-blue-600 text-white shadow"
                        : "text-blue-600 hover:bg-blue-200"
                    }`}
                >
                  <span role="img" aria-label="Vendor">
                    🏢
                  </span>{" "}
                  Vendor
                </button>
              </div>
            </div>

            {/* Login/Signup Toggle - Outlined tab style */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-lg border border-gray-300 bg-gray-50 shadow-sm">
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 min-w-[100px] px-5 py-2 rounded-l-lg text-base font-medium whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
                    ${
                      isLogin
                        ? "bg-indigo-600 text-white shadow"
                        : "text-gray-700 hover:bg-indigo-100"
                    }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 min-w-[100px] px-5 py-2 rounded-r-lg text-base font-medium whitespace-nowrap transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2
                    ${
                      !isLogin
                        ? "bg-indigo-600 text-white shadow"
                        : "text-gray-700 hover:bg-indigo-100"
                    }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Form */}
            {showEditVendorForm ? (
              <form onSubmit={handleSubmitEditVendor} className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={editVendorFormData.name}
                    onChange={handleEditVendorFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter the vendor name"
                    disabled={
                      localStorage.getItem("userType") !== "support_vendor"
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={editVendorFormData.password}
                    onChange={handleEditVendorFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter the password"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={editVendorFormData.email}
                    onChange={handleEditVendorFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter the email"
                    disabled={
                      localStorage.getItem("userType") !== "support_vendor"
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="mobile"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Mobile
                  </label>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={editVendorFormData.mobile}
                    onChange={handleEditVendorFormChange}
                    required
                    pattern="[0-9]{10,15}"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter the mobile number"
                  />
                </div>
                <div>
                  <label
                    htmlFor="gender"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={editVendorFormData.gender}
                    onChange={handleEditVendorFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="address"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={editVendorFormData.address}
                    onChange={handleEditVendorFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter the address"
                  />
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Updating vendor...
                    </span>
                  ) : (
                    "Update Vendor"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditVendorForm(false)}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
              </form>
            ) : showEditForm ? (
              <form onSubmit={handleSubmitEdit} className="space-y-4">
                <div>
                  <label
                    htmlFor="username"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={editFormData.username}
                    onChange={handleEditFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter the username"
                    disabled={
                      localStorage.getItem("userType") !== "support_user"
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={editFormData.password}
                    onChange={handleEditFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter the password"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={editFormData.email}
                    onChange={handleEditFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter the email"
                  />
                </div>
                <div>
                  <label
                    htmlFor="mobile"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Mobile
                  </label>
                  <input
                    type="tel"
                    id="mobile"
                    name="mobile"
                    value={editFormData.mobile}
                    onChange={handleEditFormChange}
                    required
                    pattern="[0-9]{10,15}"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter the mobile number"
                  />
                </div>
                <div>
                  <label
                    htmlFor="gender"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={editFormData.gender}
                    onChange={handleEditFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Updating user...
                    </span>
                  ) : (
                    "Update User"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Vendor Login: Email + Password only */}
                {isVendor && isLogin && (
                  <>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your email"
                      />
                    </div>
                  </>
                )}

                {/* Vendor Signup: Name, Email, Gender, Mobile, Address, Password */}
                {isVendor && !isLogin && (
                  <>
                    <div>
                      <label
                        htmlFor="username"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Name
                      </label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="gender"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Gender
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select your gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label
                        htmlFor="mobile"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Mobile
                      </label>
                      <input
                        type="tel"
                        id="mobile"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        required
                        pattern="[0-9]{10,15}"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your mobile number"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Address
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your address"
                      />
                    </div>
                  </>
                )}

                {/* User Login/Signup */}
                {!isVendor && (
                  <>
                    <div>
                      <label
                        htmlFor="username"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {isVendor ? "Name" : "Username"}
                      </label>
                      <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder={
                          isVendor ? "Enter your name" : "Enter your username"
                        }
                      />
                    </div>
                    {!isLogin && (
                      <>
                        <div>
                          <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your email"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="gender"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Gender
                          </label>
                          <select
                            id="gender"
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select your gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label
                            htmlFor="mobile"
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Mobile
                          </label>
                          <input
                            type="tel"
                            id="mobile"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleInputChange}
                            required
                            pattern="[0-9]{10,15}"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter your mobile number"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Password field for all cases */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your password"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {isLogin ? "Signing in..." : "Creating account..."}
                    </span>
                  ) : isLogin ? (
                    "Sign In"
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isLogin
                  ? "Don't have an account? "
                  : "Already have an account? "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Waste Management Info Section - at the bottom for mobile */}
      <div className="md:hidden w-full max-w-md mx-auto bg-gradient-to-r from-green-50 via-blue-50 to-indigo-100 rounded-3xl shadow-xl p-6 mt-12 mb-8 flex flex-col items-center animate-fade-in border border-indigo-100">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-green-600 text-3xl">♻️</span>
          <h2 className="text-xl md:text-2xl font-bold text-indigo-700">
            Why is Waste Management Necessary?
          </h2>
        </div>
        <p className="text-gray-700 text-center text-base md:text-lg mt-2">
          Effective waste management is crucial for protecting our environment,
          conserving natural resources, and ensuring public health. By properly
          sorting, recycling, and disposing of waste, we reduce pollution, save
          energy, and create a cleaner, more sustainable future for everyone.
        </p>
        <blockquote className="italic text-indigo-600 mt-4 text-center text-sm md:text-base">
          “The greatest threat to our planet is the belief that someone else
          will save it.”
        </blockquote>
      </div>

      {/* Footer */}
      <footer className="w-full mt-8 py-6 bg-white/80 backdrop-blur border-t border-indigo-100 flex flex-col items-center text-gray-500 text-sm">
        <div>© {new Date().getFullYear()} EcoWaste. All rights reserved.</div>
        <div className="mt-1 italic text-green-700">
          Together, we build a cleaner future.
        </div>
      </footer>
    </div>
  );
}
