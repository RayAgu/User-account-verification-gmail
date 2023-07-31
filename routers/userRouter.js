const express = require("express");
const router = express.Router();
const {signUp,verifyEmail, resendVerificationEmail, signIn, signOut, allUsers, changePasseord, forgotPassword } = require("../controllers/usercontroller")

router.route("/user/sign-up").post(signUp);

router.route("/user/verify-email/:token").get(verifyEmail);

router.route("/user/resend-verification-email").post(resendVerificationEmail);

router.route("/user/sign-in").post(signIn);

router.route("/user/sign-out").post(signOut)

router.route("/user/all-user").get(allUsers);

router.route("/user/:id").post(changePasseord);

router.route("/user/reset").post(forgotPassword)


module.exports = router;