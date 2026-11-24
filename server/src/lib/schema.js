// Options every schema uses: timestamps, `id` instead of `_id`, no `__v`, virtuals included.
function transform(_doc, ret) {
  ret.id = String(ret._id);
  delete ret._id;
  delete ret.__v;
  return ret;
}

export const baseSchemaOptions = {
  timestamps: true,
  toJSON: { virtuals: true, versionKey: false, transform },
  toObject: { virtuals: true, versionKey: false, transform },
};
