// The only user shapes allowed in responses. See shared contract section 4.2 and section 6.

// Safe to show anyone: used in posts, lists and requests.
export function toPublicProfile(user) {
  if (!user) return null;
  return {
    id: String(user._id ?? user.id),
    name: user.name,
    department: user.department,
    batch: user.batch,
    skills: user.skills ?? [],
  };
}

// Contact details: ONLY returned by GET /api/requests/:id/contact once a request is approved.
export function toContact(user) {
  if (!user) return null;
  const contact = { name: user.name, email: user.email };
  if (user.phone) contact.phone = user.phone;
  return contact;
}

// The signed-in user's own account (GET /api/auth/me, PATCH /api/users/me).
export function toSelf(user) {
  if (!user) return null;
  return {
    ...toPublicProfile(user),
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    isVerified: user.isVerified,
  };
}
