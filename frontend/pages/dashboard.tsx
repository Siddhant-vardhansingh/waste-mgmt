import axios from "axios";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";

function formatDate(input: string): string {
  const date = new Date(input);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;
  const formattedTime = `${hours}:${minutes} ${ampm}`;

  return `${day}/${month}/${year} ${formattedTime}`;
}

export default function Dashboard() {
  const [userRole, setUserRole] = useState("");
  const router = useRouter();
  const [showOrdersMenu, setShowOrdersMenu] = useState(false);
  const [showPastOrders, setShowPastOrders] = useState(false);
  const [orders, setOrders] = useState([]);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [itemsData, setItemsData] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number }>(
    {}
  );
  const [pickupDate, setPickupDate] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [itemQuantity, setItemQuantity] = useState(0.01);
  const [selectedState, setSelectedState] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [stateDistricts, setStateDistricts] = useState<{
    [state: string]: string[];
  }>({});

  useEffect(() => {
    const fetchStateDistricts = async () => {
      try {
        const res = await fetch(
          "https://raw.githubusercontent.com/sab99r/Indian-States-And-Districts/master/states-and-districts.json"
        );
        const json = await res.json();
        const states = json.states;

        const districtMap: { [key: string]: string[] } = {};
        for (const entry of states) {
          if (entry.state && Array.isArray(entry.districts)) {
            districtMap[entry.state] = entry.districts;
          }
        }

        setStateDistricts(districtMap);
      } catch (err) {
        console.error("Failed to fetch state/district data", err);
      }
    };

    fetchStateDistricts();
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("userType");
    setUserRole(role || "");

    if (role === "vendor" || role === "support_vendor") {
      handleGetPastOrders();
    }
  }, []);

  const handleGoHome = () => {
    router.push("/");
  };

  const handleShowOrdersMenu = () => {
    setShowOrdersMenu(!showOrdersMenu);
    setShowPastOrders(false);
    setShowCreateOrder(false);
  };

  const handleGetPastOrders = async () => {
    setShowPastOrders(true);
    setShowCreateOrder(false);
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userType");

    try {
      const endpoint =
        role === "vendor" || role === "support_vendor"
          ? "http://localhost:8002/vendor/order"
          : "http://localhost:8002/orders";

      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setOrders(response.data.orders || []);
    } catch (err) {
      setOrders([]);
    }
  };

  const handleShowCreateOrder = async () => {
    setShowCreateOrder(true);
    setShowPastOrders(false);
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get("http://localhost:8002/items", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItemsData(response.data.data.scrap_items || []);
    } catch (err) {
      setItemsData([]);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedItem("");
    setItemQuantity(0.01);
  };

  const handleAddItemToOrder = () => {
    if (selectedItem && itemQuantity > 0) {
      setSelectedItems((prev) => ({ ...prev, [selectedItem]: itemQuantity }));
      setSelectedItem("");
      setItemQuantity(0.01);
    }
  };

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    setSelectedDistrict("");
  };

  const handleCreateOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    // Check if there are items to submit
    if (Object.keys(selectedItems).length === 0) {
      alert("Please select at least one item in the list.");
      return;
    }
    try {
      await axios.post(
        "http://localhost:8002/order",
        {
          items: selectedItems,
          pickup_date: pickupDate,
          pickup_address: `${selectedDistrict}, ${selectedState}`,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Order created successfully!");
      setShowCreateOrder(false);
      setSelectedItems({});
      setPickupDate("");
    } catch (err) {
      alert("Failed to create order");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-gradient-to-br from-green-100 via-blue-100 to-indigo-200 p-0">
      {/* Sticky Header Bar */}
      <header className="w-full sticky top-0 z-20 bg-white/90 backdrop-blur shadow-lg flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <span className="text-green-600 text-4xl drop-shadow-lg">♻️</span>
          <span className="text-3xl font-extrabold text-indigo-700 tracking-tight drop-shadow">
            EcoWaste
          </span>
        </div>
        <nav className="flex gap-8 items-center">
          <button
            onClick={handleGoHome}
            className="text-blue-600 hover:text-blue-800 font-semibold transition-colors text-lg"
          >
            Home
          </button>
          <span className="text-gray-300 text-xl">|</span>
          <span className="text-indigo-700 font-bold text-lg">Dashboard</span>
          <span className="text-gray-300 text-xl">|</span>
          <button
            onClick={() => {
              localStorage.clear();
              router.push("/");
            }}
            className="text-red-500 hover:text-red-700 font-semibold transition-colors text-lg"
          >
            Logout
          </button>
        </nav>
      </header>

      {/* Main Actions Button Group - at the top */}
      {userRole !== "vendor" && userRole !== "support_vendor" && (
        <div className="flex flex-wrap justify-center gap-8 mt-12 mb-12 animate-fade-in">
          <button
            onClick={handleShowOrdersMenu}
            className="flex items-center gap-3 bg-gradient-to-r from-purple-600 to-indigo-500 text-white px-10 py-4 rounded-2xl hover:scale-105 hover:shadow-2xl active:scale-95 transition-all shadow-xl text-xl font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <span className="text-2xl">📦</span> Orders
          </button>
          {showOrdersMenu && (
            <>
              <button
                onClick={handleGetPastOrders}
                className="flex items-center gap-3 bg-gradient-to-r from-green-500 to-green-400 text-white px-10 py-4 rounded-2xl hover:scale-105 hover:shadow-2xl active:scale-95 transition-all shadow-xl text-xl font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <span className="text-2xl">🕑</span> Get Past Orders
              </button>
              <button
                onClick={handleShowCreateOrder}
                className="flex items-center gap-3 bg-gradient-to-r from-indigo-500 to-blue-400 text-white px-10 py-4 rounded-2xl hover:scale-105 hover:shadow-2xl active:scale-95 transition-all shadow-xl text-xl font-bold tracking-wide focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <span className="text-2xl">➕</span> Create Order
              </button>
            </>
          )}
        </div>
      )}

      {/* Divider */}
      <div className="w-full max-w-2xl border-t border-indigo-200 mb-12"></div>

      {/* Past Orders List */}
      {showPastOrders && (
        <div className="mt-4 w-full max-w-2xl animate-fade-in">
          <div className="bg-white/90 rounded-3xl shadow-2xl p-10 transition-shadow hover:shadow-3xl">
            <h2 className="text-3xl font-extrabold mb-8 text-indigo-700 border-b-2 border-indigo-100 pb-3 tracking-tight">
              Past Orders
            </h2>
            {orders.length === 0 ? (
              <p className="text-gray-500 text-lg">No orders found.</p>
            ) : (
              <ul className="space-y-8">
                {orders.map((order: any) => (
                  <li
                    key={order.order_id}
                    className="border border-indigo-100 rounded-2xl p-6 bg-indigo-50 shadow-md hover:shadow-xl transition-all animate-fade-in"
                  >
                    <div className="flex flex-col md:flex-row md:gap-10 gap-3">
                      <div className="flex-1">
                        <span className="font-semibold text-gray-700">
                          Item:
                        </span>{" "}
                        {order.item_type}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-gray-700">
                          Quantity:
                        </span>{" "}
                        {order.quantity} Kgs
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row md:gap-10 gap-3 mt-2">
                      <div className="flex-1">
                        <span className="font-semibold text-gray-700">
                          Pickup Date:
                        </span>{" "}
                        {formatDate(order.pickup_date)}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-gray-700">
                          Order Date:
                        </span>{" "}
                        {formatDate(order.order_date)}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-gray-700">
                          Pickup Address:
                        </span>{" "}
                        {order.pickup_address}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Create Order Form */}
      {showCreateOrder && (
        <form
          onSubmit={handleCreateOrderSubmit}
          className="mt-4 w-full max-w-2xl animate-fade-in"
        >
          <div className="bg-white/90 rounded-3xl shadow-2xl p-10 transition-shadow hover:shadow-3xl">
            <h2 className="text-3xl font-extrabold mb-8 text-indigo-700 border-b-2 border-indigo-100 pb-3 tracking-tight">
              Create Order
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block mb-2 font-semibold text-lg">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="border px-3 py-3 rounded-xl w-full focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-lg"
                >
                  <option value="">Select Category</option>
                  {itemsData.map((category: any) => (
                    <option key={category.category} value={category.category}>
                      {category.category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-semibold text-lg">Item</label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="border px-3 py-3 rounded-xl w-full focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-lg"
                  disabled={!selectedCategory}
                >
                  <option value="">Select Item</option>
                  {selectedCategory &&
                    (
                      itemsData.find(
                        (cat: any) => cat.category === selectedCategory
                      )?.items || []
                    ).map((item: string) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 font-semibold text-lg">
                  Quantity (Kgs)
                </label>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(parseFloat(e.target.value))}
                  className="border px-3 py-3 rounded-xl w-full focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-lg"
                  placeholder="Qty in Kgs"
                  disabled={!selectedItem}
                />
              </div>
            </div>
            <button
              type="button"
              className="bg-gradient-to-r from-green-500 to-green-400 text-white px-6 py-3 rounded-xl hover:scale-105 hover:shadow-xl active:scale-95 transition-all shadow font-semibold mb-6 w-full md:w-auto text-lg"
              onClick={handleAddItemToOrder}
              disabled={!selectedCategory || !selectedItem || !itemQuantity}
            >
              Add Item
            </button>
            {Object.keys(selectedItems).length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-3 text-indigo-700 text-lg">
                  Items in Order
                </h3>
                <ul className="list-disc list-inside text-gray-700 text-lg">
                  {Object.entries(selectedItems).map(([item, qty]) => (
                    <li key={item}>
                      {item}: {qty} Kgs
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mb-6">
              <label className="block mb-2 font-semibold text-lg">
                Pickup Date
              </label>
              <input
                type="datetime-local"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="border px-3 py-3 rounded-xl w-full focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-lg"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-semibold text-lg">
                Pickup Address
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <select
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="border px-3 py-3 rounded-xl w-full focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-lg"
                  >
                    <option value="">State</option>
                    {Object.keys(stateDistricts).map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="border px-3 py-3 rounded-xl w-full focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all text-lg"
                    disabled={!selectedState}
                  >
                    <option value="">District</option>
                    {(stateDistricts[selectedState] || []).map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-indigo-500 text-white px-6 py-3 rounded-xl hover:scale-105 hover:shadow-xl active:scale-95 transition-all shadow font-semibold w-full md:w-auto text-lg"
              disabled={Object.keys(selectedItems).length === 0}
            >
              Submit Order
            </button>
          </div>
        </form>
      )}

      {/* Waste Management Info Section - at the bottom */}
      <div className="w-full max-w-3xl bg-gradient-to-r from-green-50 via-blue-50 to-indigo-100 rounded-3xl shadow-2xl p-10 mt-20 mb-10 flex flex-col items-center animate-fade-in border border-indigo-100">
        <div className="flex items-center gap-5 mb-4">
          <span className="text-green-500 text-6xl">♻️</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-indigo-800 drop-shadow">
            Why is Waste Management Necessary?
          </h1>
        </div>
        <p className="text-gray-700 text-center text-xl md:text-2xl mt-2 max-w-2xl">
          Effective waste management is crucial for protecting our environment,
          conserving natural resources, and ensuring public health. By properly
          sorting, recycling, and disposing of waste, we reduce pollution, save
          energy, and create a cleaner, more sustainable future for everyone.
        </p>
        <blockquote className="italic text-indigo-600 mt-6 text-center text-lg md:text-xl">
          “The greatest threat to our planet is the belief that someone else
          will save it.”
        </blockquote>
      </div>

      {/* Footer */}
      <footer className="w-full mt-8 py-8 bg-white/90 backdrop-blur border-t border-indigo-100 flex flex-col items-center text-gray-500 text-base">
        <div>© {new Date().getFullYear()} EcoWaste. All rights reserved.</div>
        <div className="mt-2 italic text-green-700">
          Together, we build a cleaner future.
        </div>
      </footer>
    </div>
  );
}
