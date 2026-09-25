import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

// Run an array of express-validator rules, then fail with a 400 listing every problem.
export const validate = (rules) => [
  ...rules,
  (req, _res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    const errors = result.array({ onlyFirstError: true }).map((e) => ({ field: e.path, message: e.msg }));
    return next(ApiError.badRequest(errors[0].message, errors));
  },
];
