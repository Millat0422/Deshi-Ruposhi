import { body, param, query } from 'express-validator';
import { GENDER_OPTIONS, SIZE_OPTIONS } from '../models/Product.js';
import { ORDER_STATUSES, PAYMENT_METHODS } from '../models/Order.js';
import { isValidImageUrl } from '../services/imageService.js';

// Removes HTML tags from free text (React escapes output too, this keeps stored data clean).
const stripTags = (value) => (typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : value);

const PASSWORD_RULE =
  'Password must be at least 8 characters and include a letter and a number';
const passwordField = (field = 'password') =>
  body(field)
    .isString()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage(PASSWORD_RULE)
    .matches(/[A-Za-z]/)
    .withMessage(PASSWORD_RULE)
    .matches(/\d/)
    .withMessage(PASSWORD_RULE);

const emailField = (field = 'email') =>
  body(field).trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Enter a valid email address').normalizeEmail({ gmail_remove_dots: false }).isLength({ max: 254 });

export const mongoIdParam = (name = 'id') => param(name).isMongoId().withMessage(`Invalid ${name}`);

// ---------- Auth ----------
export const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters').customSanitizer(stripTags),
  emailField(),
  passwordField(),
  body('confirmPassword')
    .optional()
    .custom((value, { req }) => value === req.body.password)
    .withMessage('Passwords do not match'),
];

export const loginRules = [
  emailField(),
  body('password').isString().notEmpty().withMessage('Password is required').isLength({ max: 128 }),
];

export const forgotPasswordRules = [emailField()];

export const resetPasswordRules = [
  param('token').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('Invalid or expired reset link'),
  passwordField(),
];

export const updateProfileRules = [
  body('name').optional().trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters').customSanitizer(stripTags),
  body('currentPassword')
    .if(body('newPassword').exists({ values: 'falsy' }))
    .isString()
    .notEmpty()
    .withMessage('Enter your current password to set a new one'),
  body('newPassword').optional({ values: 'falsy' }).isString().isLength({ min: 8, max: 128 }).withMessage(PASSWORD_RULE).matches(/[A-Za-z]/).withMessage(PASSWORD_RULE).matches(/\d/).withMessage(PASSWORD_RULE),
];

// ---------- Address ----------
const addressFields = (prefix = '') => [
  body(`${prefix}fullName`).trim().notEmpty().withMessage('Full name is required').isLength({ max: 80 }).customSanitizer(stripTags),
  body(`${prefix}phone`).trim().notEmpty().withMessage('Phone is required').matches(/^[+()\d\s-]{6,30}$/).withMessage('Enter a valid phone number'),
  body(`${prefix}address`).trim().notEmpty().withMessage('Address is required').isLength({ max: 200 }).customSanitizer(stripTags),
  body(`${prefix}city`).trim().notEmpty().withMessage('City is required').isLength({ max: 80 }).customSanitizer(stripTags),
  body(`${prefix}state`).trim().notEmpty().withMessage('State / division is required').isLength({ max: 80 }).customSanitizer(stripTags),
  body(`${prefix}postalCode`).trim().notEmpty().withMessage('Postal code is required').matches(/^[A-Za-z0-9\s-]{3,12}$/).withMessage('Enter a valid postal code'),
  body(`${prefix}country`).trim().notEmpty().withMessage('Country is required').isLength({ max: 80 }).customSanitizer(stripTags),
];

export const addressRules = [
  body('label').optional().trim().isLength({ max: 40 }).customSanitizer(stripTags),
  body('isDefault').optional().isBoolean().toBoolean(),
  ...addressFields(),
];

// ---------- Products ----------
const productBody = (isUpdate) => {
  const opt = (chain) => (isUpdate ? chain.optional() : chain);
  return [
    opt(body('name')).trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }).customSanitizer(stripTags),
    opt(body('description')).trim().notEmpty().withMessage('Description is required').isLength({ max: 3000 }).customSanitizer(stripTags),
    opt(body('category')).isMongoId().withMessage('Select a valid category'),
    body('gender').optional().isIn(GENDER_OPTIONS).withMessage('Invalid gender'),
    opt(body('price')).isFloat({ min: 0, max: 100000 }).withMessage('Price must be a number of 0 or more').toFloat(),
    body('originalPrice').optional({ values: 'falsy' }).isFloat({ min: 0, max: 100000 }).withMessage('Original price must be 0 or more').toFloat(),
    opt(body('stock')).isInt({ min: 0, max: 1000000 }).withMessage('Stock must be a whole number of 0 or more').toInt(),
    opt(body('sku')).trim().notEmpty().withMessage('SKU is required').matches(/^[A-Za-z0-9-_]{2,40}$/).withMessage('SKU may only contain letters, numbers, - and _'),
    body('brand').optional().trim().isLength({ max: 60 }).customSanitizer(stripTags),
    opt(body('images')).isArray({ min: 1, max: 8 }).withMessage('Add between 1 and 8 image URLs'),
    body('images.*').custom(isValidImageUrl).withMessage('Each image must be a valid http(s) URL'),
    body('sizes').optional().isArray({ max: SIZE_OPTIONS.length }),
    body('sizes.*').isIn(SIZE_OPTIONS).withMessage('Invalid size'),
    body('colors').optional().isArray({ max: 12 }),
    body('colors.*.name').trim().notEmpty().withMessage('Color name is required').isLength({ max: 30 }).customSanitizer(stripTags),
    body('colors.*.hex').optional().matches(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).withMessage('Color must be a hex code like #1A1A1A'),
    body('featured').optional().isBoolean().toBoolean(),
    body('active').optional().isBoolean().toBoolean(),
    body('rating').optional().isFloat({ min: 0, max: 5 }).toFloat(),
    body('numReviews').optional().isInt({ min: 0 }).toInt(),
    body('originalPrice').custom((value, { req }) => {
      if (value && req.body.price !== undefined && Number(value) > 0 && Number(value) < Number(req.body.price)) {
        throw new Error('Original price should be higher than the selling price (or empty)');
      }
      return true;
    }),
  ];
};

export const createProductRules = productBody(false);
export const updateProductRules = [mongoIdParam(), ...productBody(true)];

export const productQueryRules = [
  query('search').optional().isString().isLength({ max: 100 }),
  query('minPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('minPrice must be 0 or more'),
  query('maxPrice').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('maxPrice must be 0 or more'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 60 }),
  query('sort').optional().isIn(['newest', 'price_asc', 'price_desc', 'popular', 'rating', 'name']).withMessage('Invalid sort option'),
  query('gender').optional().isIn([...GENDER_OPTIONS, '']),
];

// ---------- Categories ----------
export const categoryRules = (isUpdate = false) => [
  ...(isUpdate ? [mongoIdParam()] : []),
  (isUpdate ? body('name').optional() : body('name')).trim().notEmpty().withMessage('Category name is required').isLength({ max: 60 }).customSanitizer(stripTags),
  body('description').optional().trim().isLength({ max: 500 }).customSanitizer(stripTags),
  body('image').optional({ values: 'falsy' }).custom(isValidImageUrl).withMessage('Image must be a valid URL'),
  body('active').optional().isBoolean().toBoolean(),
];

// ---------- Cart / Orders ----------
const cartItemFields = (prefix) => [
  body(`${prefix}.product`).isMongoId().withMessage('Invalid product in cart'),
  body(`${prefix}.quantity`).isInt({ min: 1, max: 99 }).withMessage('Quantity must be between 1 and 99').toInt(),
  body(`${prefix}.size`).optional().isString().trim().isLength({ max: 20 }),
  body(`${prefix}.color`).optional().isString().trim().isLength({ max: 30 }),
];

export const cartRules = [body('items').isArray({ max: 50 }).withMessage('items must be a list'), ...cartItemFields('items.*')];

export const quoteRules = [
  body('items').isArray({ min: 1, max: 50 }).withMessage('Your cart is empty'),
  ...cartItemFields('items.*'),
  body('couponCode').optional({ values: 'falsy' }).isString().trim().isLength({ max: 30 }),
];

export const createOrderRules = [
  ...quoteRules,
  ...addressFields('shippingAddress.'),
  body('paymentMethod').isIn(PAYMENT_METHODS).withMessage('Choose a payment method'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).customSanitizer(stripTags),
  body('saveAddress').optional().isBoolean().toBoolean(),
];

export const orderStatusRules = [
  mongoIdParam(),
  body('status').isIn(ORDER_STATUSES).withMessage('Invalid order status'),
  body('note').optional().isString().trim().isLength({ max: 300 }).customSanitizer(stripTags),
];

// ---------- Users (admin) ----------
export const adminUpdateUserRules = [
  mongoIdParam(),
  body('role').optional().isIn(['user', 'admin']).withMessage('Role must be user or admin'),
  body('isActive').optional().isBoolean().toBoolean(),
  body('name').optional().trim().isLength({ min: 2, max: 60 }).customSanitizer(stripTags),
];

export const newsletterRules = [emailField()];
