import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  user: mongoose.Types.ObjectId;
  type: 'Create' | 'Update' | 'Delete' | 'Login' | 'Export' | 'System' | 'call' | 'email' | 'meeting' | 'note';
  module: string;
  description: string;
  metadata?: any;
  ipAddress?: string;
  createdAt: Date;
}

const ActivitySchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['Create', 'Update', 'Delete', 'Login', 'Export', 'System', 'call', 'email', 'meeting', 'note'],
    required: true 
  },
  module: { type: String, required: true }, // e.g., 'Users', 'CRM', 'Media'
  description: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed },
  ipAddress: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Activity = mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);
