const stripe = Stripe(
  "pk_test_51NGNxQKX3c8QYMeDPpw60ZWyJoeSMZn9kcTCcRnGloLZ3YHwo20yehBe011mHoXuiyn5lvw27xat2qU4ViMZF1mr00vIv6lnaE"
);
import { showAlert } from "./alerts";
export const bookTour = async (tourId) => {
  try {
    //1) Get checkout session from API
    const session = await axios(
      `http://localhost:3001/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);
    //2) Create checkout form + charge creditcard
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert("error", err);
  }
};
