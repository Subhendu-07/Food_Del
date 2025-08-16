import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Place Order
const placeOrder = async (req, res) => {
  const frontend_url = "https://food-delivery-frontend-fhrn.onrender.com";

  try {
    const userId = req.user.userId; 
    const { items, amount, address } = req.body;

    // Validation
    if (!items || !amount || !address) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing order data" 
      });
    }

    // Create new order
    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
    });

    await newOrder.save();

    // Clear user's cart
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    // Prepare Stripe line items
    const line_items = items.map((item) => ({
      price_data: {
        currency: "inr",
        product_data: { name: item.name },
        unit_amount: item.price * 100 * 80, 
      },
      quantity: item.quantity,
    }));

    // Add delivery charges
    line_items.push({
      price_data: {
        currency: "inr",
        product_data: { name: "Delivery Charges" },
        unit_amount: 2 * 100 * 80,
      },
      quantity: 1,
    });

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`,
    });

    res.json({ 
      success: true, 
      session_url: session.url 
    });

  } catch (error) {
    console.error("Order Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to place order" 
    });
  }
};

// Verify Payment
const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;

  try {
    const order = await orderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }

    if (success === "true") {
      if (order.payment) {
        return res.json({ 
          success: true, 
          message: "Payment already confirmed" 
        });
      }
      order.payment = true;
      await order.save();
      return res.json({ 
        success: true, 
        message: "Payment confirmed" 
      });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      return res.json({ 
        success: false, 
        message: "Payment failed, order cancelled" 
      });
    }
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to verify order" 
    });
  }
};

// Get User Orders
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel.find({ 
      userId: req.user.userId 
    });
    res.json({ 
      success: true, 
      data: orders 
    });
  } catch (error) {
    console.error("Orders Fetch Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch orders" 
    });
  }
};


// Listing orders for admin panel
const listOrders = async (req,res) => {
  try {
    const orders = await orderModel.find({});
    res.json({success:true,data:orders})
  } catch (error) {
    console.log(error);
    res.json({success:false,message:"Error"})
  }
}


// api for updating order status
const updateStatus = async (req,res) => {
  try {
    await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status});
    res.json({success:true,message:"Status Updated"})
  } catch (error) {
    console.log(error)
    res.json({success:false,message:"Error"})
  }
}

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };