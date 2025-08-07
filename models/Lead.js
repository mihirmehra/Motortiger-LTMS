import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\+?1?[-.\s]?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/.test(v);
      },
      message: 'Please enter a valid US mobile number'
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  productName: {
    type: String,
    trim: true
  },
  productPrice: {
    type: Number,
    min: 0
  },
  salePrice: {
    type: Number,
    min: 0
  },
  profitMargin: {
    type: Number,
    default: function() {
      if (this.salePrice && this.productPrice) {
        return this.salePrice - this.productPrice;
      }
      return 0;
    }
  },
  source: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['new', 'in-progress', 'sold', 'lost'],
    default: 'new'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: [{
    content: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  emailHistory: [{
    subject: String,
    content: String,
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sentAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Calculate profit margin when sale price is set
leadSchema.pre('save', function(next) {
  if (this.salePrice && this.productPrice) {
    this.profitMargin = this.salePrice - this.productPrice;
  } else {
    this.profitMargin = 0;
  }
  next();
});

export default mongoose.models.Lead || mongoose.model('Lead', leadSchema);