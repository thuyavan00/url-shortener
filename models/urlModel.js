const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    short: { type: Number, required: true, default: 1 },
  },
  {
    timestamps: false,
  }
);

urlSchema.statics.createAndIncrementShort = async function (url) {
  try {
    // Find the existing URL document in the collection
    let existingUrl = await this.findOne({ url });

    if (existingUrl) {
      // If the URL already exists, return it without modification
      return existingUrl;
    } else {
      // If the URL does not exist, find the highest short value
      const highestShortValue = await this.findOne(
        {},
        {},
        { sort: { short: -1 } }
      ).select('short');

      // Increment the short value or set it to 1 if no existing documents
      const newShortValue = highestShortValue ? highestShortValue.short + 1 : 1;

      // Create a new entry with the URL and the calculated short value
      const newUrl = await this.create({ url, short: newShortValue });

      return newUrl;
    }
  } catch (error) {
    console.error('Error creating or updating URL:', error);
    throw error;
  }
};

const UrlModel = mongoose.model('url', urlSchema);

module.exports = UrlModel;
