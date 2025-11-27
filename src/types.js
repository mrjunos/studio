
export const productCategories = ["Bebidas", "Alimentos", "Mercancía"];

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} name
 * @property {string} category
 * @property {number} price
 * @property {number} stock
 * @property {string} [imageUrl]
 */

/**
 * @typedef {Object} SaleItem
 * @property {string} productId
 * @property {string} productName
 * @property {number} quantity
 * @property {number} priceAtSale
 */

/**
 * @typedef {Object} Sale
 * @property {string} id
 * @property {SaleItem[]} items
 * @property {number} totalAmount
 * @property {string} saleDate
 */

/**
 * @typedef {Object} InventoryAdjustment
 * @property {string} id
 * @property {string} productId
 * @property {string} productName
 * @property {number} quantityChange
 * @property {string} [reason]
 * @property {string} adjustmentDate
 */

/**
 * @typedef {Object} OtherIncome
 * @property {string} id
 * @property {string} description
 * @property {number} amount
 * @property {string} incomeDate
 */

export const expenseCategories = ["Suministros", "Servicios Públicos", "Arriendo", "Publicidad", "Salarios", "Otros"];

/**
 * @typedef {Object} Expense
 * @property {string} id
 * @property {string} description
 * @property {number} amount
 * @property {string} category
 * @property {string} expenseDate
 */
