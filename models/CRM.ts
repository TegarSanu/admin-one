import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  industry: string;
  size: string;
  website?: string;
  address?: string;
  createdAt: Date;
}

const CompanySchema: Schema = new Schema({
  name: { type: String, required: true },
  industry: { type: String, required: true },
  size: { type: String, required: true },
  website: { type: String },
  address: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export interface ILead extends Document {
  name: string;
  email: string;
  phone?: string;
  company: mongoose.Types.ObjectId;
  status: 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost';
  value: number;
  priority: 'Low' | 'Medium' | 'High';
  assignedTo?: mongoose.Types.ObjectId;
  lastContacted?: Date;
  notes?: string;
  createdAt: Date;
}

const LeadSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
  status: { 
    type: String, 
    enum: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
    default: 'New' 
  },
  value: { type: Number, default: 0 },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  lastContacted: { type: Date },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Company = mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
export const Lead = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);
