import React, { useContext, useEffect, useState } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const PlaceOrder = () => {
  const { getTotalCartAmount, token, food_list, cartItems, url } = useContext(StoreContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const navigate = useNavigate();

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  // Handle input changes
  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  // Main Place Order function
  const placeOrder = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!token) {
      toast.error("Please login to place an order");
      setIsSubmitting(false);
      return;
    }

    const orderItems = food_list
      .filter((item) => cartItems[item._id] > 0)
      .map((item) => ({
        id: item._id,
        name: item.name,
        price: item.price,
        quantity: cartItems[item._id],
      }));

    if (orderItems.length === 0) {
      toast.warn("Your cart is empty");
      setIsSubmitting(false);
      return;
    }

    const orderData = {
      address: data,
      items: orderItems,
      amount: getTotalCartAmount() + 2,
      paymentMethod,
    };

    try {
      if (paymentMethod === "cod") {
        try {
          // COD order placement
          const codResponse = await axios.post(`${url}/api/order/place-cod`, orderData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (codResponse.data.success) {
            Object.keys(cartItems).forEach(id => {
              cartItems[id] = 0;
            });

            setTimeout(() => {
              toast.success("Order placed successfully!");
            }, 300);
            setTimeout(() => navigate("/myorders"), 1500);
          } else {
            toast.error(codResponse.data.message || "Error placing COD order");
          }
        } catch (error) {
          console.error("COD order error:", error);
          toast.error(error.response?.data?.message || "Failed to place COD order");
        }
      } else {
        try {
          // Stripe order placement
          const stripeResponse = await axios.post(`${url}/api/order/place`, orderData, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (stripeResponse.data.success && stripeResponse.data.session_url) {
            window.location.href = stripeResponse.data.session_url;
          } else {
            toast.error(stripeResponse.data.message || "Error initiating Stripe checkout");
          }
        } catch (error) {
          console.error("Stripe order error:", error);
          toast.error(error.response?.data?.message || "Failed to initiate Stripe checkout");
        }
      }

    } catch (error) {
      console.error("Place order error:", error);
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if not logged in or cart empty
  useEffect(() => {
    if (!token || getTotalCartAmount() === 0) {
      navigate("/cart");
    }
  }, [token, getTotalCartAmount, navigate]);

  return (
    <form onSubmit={placeOrder} className="place-order">
      {/* LEFT SIDE FORM */}
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input name="firstName" onChange={onChangeHandler} value={data.firstName} placeholder="First name" required />
          <input name="lastName" onChange={onChangeHandler} value={data.lastName} placeholder="Last name" required />
        </div>
        <input name="email" onChange={onChangeHandler} value={data.email} type="email" placeholder="Email address" required />
        <input name="street" onChange={onChangeHandler} value={data.street} placeholder="Street" required />
        <div className="multi-fields">
          <input name="city" onChange={onChangeHandler} value={data.city} placeholder="City" required />
          <input name="state" onChange={onChangeHandler} value={data.state} placeholder="State" required />
        </div>
        <div className="multi-fields">
          <input name="zipcode" onChange={onChangeHandler} value={data.zipcode} placeholder="Zip code" required />
          <input name="country" onChange={onChangeHandler} value={data.country} placeholder="Country" required />
        </div>
        <input name="phone" onChange={onChangeHandler} value={data.phone} type="tel" placeholder="Phone" required />
      </div>

      {/* RIGHT SIDE */}
      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>${getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>${getTotalCartAmount() === 0 ? 0 : 2}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>${getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2}</b>
            </div>
          </div>

          {/* PAYMENT METHOD */}
          <div className="payment-container">
            <div className="payment-title">Payment Method</div>

            <label className={`payment-option ${paymentMethod === "cod" ? "selected" : ""}`}>
              <input
                type="radio"
                name="payment"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              COD ( Cash on delivery )
            </label>

            <label className={`payment-option ${paymentMethod === "stripe" ? "selected" : ""}`}>
              <input
                type="radio"
                name="payment"
                value="stripe"
                checked={paymentMethod === "stripe"}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              Stripe ( Credit / Debit )
            </label>
          </div>

          {/* BUTTON */}
          <button type="submit" disabled={isSubmitting || getTotalCartAmount() === 0}>
            {isSubmitting ? "Processing..." : "Place Order"}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
