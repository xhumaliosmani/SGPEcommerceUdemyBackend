const express = require("express");
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    description2: {
      type: String,
    },
    description3: {
      type: String,
    },
    descriptionHero: {
      type: String,
    },
    adcopyFb1: {
      type: String,
    },
    adcopyFb2: {
      type: String,
    },
    adcopy1: {
      type: String,
    },
    adcopy2: {
      type: String,
    },
    adcopy3: {
      type: String,
    },
    creative1: {
      type: String,
    },
    creative2: {
      type: String,
    },
    free: {
      type: Boolean,
      default: false,
    },
    priceOfGoods: {
      type: Number,
    },
    sellPrice: {
      type: Number,
    },
    aliexpressLink: {
      type: String,
    },
    cjdropshippingLink: {
      type: String,
    },
    competitorShop: {
      type: String,
    },
    productAge: {
      type: String,
    },
    popullarity: {
      type: String,
    },
    competitivness: {
      type: Number,
    },
    bestPlatform: {
      type: String,
    },
    category: {
      type: String,
      default: "Beauty",
    },
    keywords: {
      type: [String],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    image1: {
      type: String,
    },
    image2: {
      type: String,
    },
    image3: {
      type: String,
    },
    image4: {
      type: String,
    },
    image5: {
      type: String,
    },
    image6: {
      type: String,
    },
    image7: {
      type: String,
    },
    image8: {
      type: String,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;