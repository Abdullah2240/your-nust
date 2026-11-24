import bcrypt from 'bcryptjs';
import { env } from '../../config/env.js';
import { HttpError, ok } from '../../lib/http.js';
import { sendMail } from '../../lib/mailer.js';
import { User } from '../users/user.model.js';
import { toSelf } from '../users/user.utils.js';
import { clearAuthCookie, hashToken, isAllowedEmail, issueToken, setAuthCookie } from './auth.service.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const BAD_LOGIN = 'Email or password is incorrect';
const BAD_LINK = 'This link is invalid or has expired. Request a new one.';

async function sendVerification(user) {
  const { token, hash } = issueToken();
  user.verifyTokenHash = hash;
  user.verifyTokenExpires = new Date(Date.now() + DAY_MS);
  await user.save();
  const link = `${env.clientUrl}/verify-email?token=${token}`;
  await sendMail({
    to: user.email,
    subject: 'Verify your Your NUST account',
    text: `Hi ${user.name},\n\nConfirm your NUST email by opening this link (valid for 24 hours):\n${link}\n\nIf you didn't sign up, ignore this email.`,
    html: `<p>Hi ${user.name},</p><p>Confirm your NUST email (link valid for 24 hours):</p><p><a href="${link}">Verify my email</a></p>`,
  });
}

export async function register(req, res) {
  const { name, email, password, department, batch } = req.body;
  if (!(await isAllowedEmail(email))) {
    throw new HttpError(400, 'VALIDATION', 'Please fix the highlighted fields.', {
      email: 'Use your NUST email, for example name@seecs.edu.pk',
    });
  }
  if (await User.exists({ email })) {
    throw new HttpError(409, 'CONFLICT', 'An account with this email already exists. Try signing in.', {
      email: 'Already registered',
    });
  }
  const user = await User.create({
    name, email, department, batch, passwordHash: await bcrypt.hash(password, 10),
  });
  await sendVerification(user);
  ok(res, { user: toSelf(user) }, 201);
}

export async function verify(req, res) {
  const user = await User.findOne({ verifyTokenHash: hashToken(req.body.token) });
  if (!user || !user.verifyTokenExpires || user.verifyTokenExpires < new Date()) {
    throw new HttpError(400, 'VALIDATION', BAD_LINK, { token: BAD_LINK });
  }
  user.isVerified = true;
  user.verifyTokenHash = undefined;
  user.verifyTokenExpires = undefined;
  await user.save();
  setAuthCookie(res, user);
  ok(res, { user: toSelf(user) });
}

export async function resendVerification(req, res) {
  const user = await User.findOne({ email: req.body.email });
  if (user && !user.isVerified) await sendVerification(user);
  ok(res, { sent: true });
}

export async function login(req, res) {
  const user = await User.findOne({ email: req.body.email });
  const valid = user && (await bcrypt.compare(req.body.password, user.passwordHash));
  if (!valid) throw new HttpError(401, 'UNAUTHENTICATED', BAD_LOGIN);
  setAuthCookie(res, user);
  ok(res, { user: toSelf(user) });
}

export async function logout(_req, res) {
  clearAuthCookie(res);
  ok(res, { signedOut: true });
}

export async function me(req, res) {
  ok(res, { user: toSelf(req.user) });
}

export async function forgotPassword(req, res) {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const { token, hash } = issueToken();
    user.resetTokenHash = hash;
    user.resetTokenExpires = new Date(Date.now() + HOUR_MS);
    await user.save();
    const link = `${env.clientUrl}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: 'Reset your Your NUST password',
      text: `Hi ${user.name},\n\nReset your password with this link (valid for 1 hour):\n${link}\n\nIf you didn't ask for this, ignore this email.`,
      html: `<p>Hi ${user.name},</p><p>Reset your password (link valid for 1 hour):</p><p><a href="${link}">Choose a new password</a></p>`,
    });
  }
  ok(res, { sent: true });
}

export async function resetPassword(req, res) {
  const user = await User.findOne({ resetTokenHash: hashToken(req.body.token) });
  if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
    throw new HttpError(400, 'VALIDATION', BAD_LINK, { token: BAD_LINK });
  }
  user.passwordHash = await bcrypt.hash(req.body.password, 10);
  user.resetTokenHash = undefined;
  user.resetTokenExpires = undefined;
  // Following a reset link proves the user owns the email.
  user.isVerified = true;
  await user.save();
  ok(res, { reset: true });
}
