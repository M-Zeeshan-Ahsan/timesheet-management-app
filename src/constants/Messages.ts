export const MESSAGES = {
  COMMON: {
    UNEXPECTED_ERROR: "An unexpected error occurred. Please try again later.",
    API_ERROR:
      "An error occurred while communicating with the server. Please try again shortly.",
  },
  AUTH: {
    LOGIN_FAILED:
      "Login attempt failed. Please check your credentials and try again.",
    WRONG_CREDENTIAL:
      "Incorrect email or password. Please double-check and try again.",
    LOGIN_SUCCESS: "Login successful!",
    SIGNUP_SUCCESS: "Your account has been created successfully.",
    SIGNUP_FAILED:
      "Signup failed. Please check the details provided and try again.",
    PASSWORD_MISMATCH: "Passwords do not match",
    FORGET_PASSWORD_SUCCESS:
      "A 4-digit OTP has been sent to your email address.",
    FORGET_PASSWORD_FAILED:
      "Failed to send password reset instructions. Please try again.",
    OTP_REQUIRED: "Please enter the 4-digit OTP to continue.",
    OTP_VERIFIED_SUCCESS: "OTP verified successfully. You may proceed.",
    OTP_VERIFIED_FAILED:
      "OTP verification failed. Please check the code and try again.",
    PASSWORD_RESET_SUCCESS: "Your password has been reset successfully.",
    PASSWORD_RESET_FAILED: "Failed to reset password. Please try again.",
  },
  CART: {
    ADD_SUCCESS: "Item added to your cart successfully!",
    ADD_FAILED: "Failed to add item to cart. Please try again.",
    REMOVE_SUCCESS: "Item removed from your cart successfully!",
    REMOVE_FAILED: "Failed to remove item from cart. Please try again.",
    UPDATE_QUANTITY_SUCCESS: "Cart item quantity updated successfully!",
    UPDATE_QUANTITY_FAILED: "Failed to update item quantity. Please try again.",
    EMPTY_CART: "Your cart is currently empty.",
    CHECKOUT_SUCCESS:
      "Checkout completed successfully! Thank you for your order.",
    CHECKOUT_FAILED: "Checkout failed. Please review your cart and try again.",
  },
};
