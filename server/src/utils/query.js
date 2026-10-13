import { ApiError } from './ApiError.js';

/** Escapes user input so it can be safely embedded in a RegExp. */
export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Case-insensitive "contains" filter across the given fields. Returns `{}` for an empty search. */
export const buildSearchFilter = (search, fields) => {
  if (!search) return {};
  const pattern = { $regex: escapeRegex(search), $options: 'i' };
  return { $or: fields.map((field) => ({ [field]: pattern })) };
};

export const getPagination = ({ page, limit }) => ({ page, limit, skip: (page - 1) * limit });

/** Sort spec with `_id` as a tie-breaker so pagination is stable. */
export const buildSort = (sortBy, sortOrder) => {
  const direction = sortOrder === 'asc' ? 1 : -1;
  return sortBy === '_id' ? { _id: direction } : { [sortBy]: direction, _id: direction };
};

export const buildPaginationMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

/** Copies only the keys whose value is not `undefined`. */
export const pickDefined = (source, keys) =>
  keys.reduce((acc, key) => {
    if (source[key] !== undefined) acc[key] = source[key];
    return acc;
  }, {});

/** Builds a `{ $gte, $lte }` range, omitting missing bounds. Returns undefined when both are missing. */
export const buildRange = (min, max) => {
  if (min === undefined && max === undefined) return undefined;
  const range = {};
  if (min !== undefined) range.$gte = min;
  if (max !== undefined) range.$lte = max;
  return range;
};

/** Turns aggregation groups `[{ _id, count }]` into `{ [key]: count }` with every key present (zero-filled). */
export const countsByKey = (keys, groups) => {
  const counts = Object.fromEntries(keys.map((key) => [key, 0]));
  groups.forEach(({ _id, count }) => {
    counts[_id] = count;
  });
  return counts;
};

/** `$group` stage counting documents per value of `field`. */
export const groupCountStage = (field) => ({ $group: { _id: `$${field}`, count: { $sum: 1 } } });

/**
 * Loads a document by id or throws 404 "<label> not found".
 * @param {import('mongoose').Model} Model
 * @param {string | import('mongoose').Types.ObjectId} id
 * @param {{ label?: string, lean?: boolean, select?: string, populate?: [string, string] }} options
 */
export const findByIdOrThrow = async (
  Model,
  id,
  { label = Model.modelName, lean = false, select, populate } = {},
) => {
  let query = Model.findById(id);
  if (select) query = query.select(select);
  if (populate) query = query.populate(...populate);
  const doc = await (lean ? query.lean() : query);
  if (!doc) throw ApiError.notFound(`${label} not found`);
  return doc;
};
