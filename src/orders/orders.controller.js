const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find(order => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  //res.locals.order = null;
  //next();
	const error = new Error(`Order id not found: ${orderId}`);
  error.status = 404;
  next(error);
}

function read(req, res) {
  if (res.locals.order === null) {
    return res.status(404).json({ error: `Order id not found: ${req.params.orderId}` });
  }
  res.json({ data: res.locals.order });
}

function list(req, res) {
  res.json({ data: orders });
}

function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      }
      next({ status: 400, message: `Must include a ${propertyName}` });
    };
  }

function dishesArrayIsOk(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!Array.isArray(dishes) || dishes.length < 1) {
    return next({
      status: 400,
      message: `Invalid dishes array: ${dishes}`,
    });
  }
  next();
}

function orderStatusOk(req, res, next) {
  const { data: { status } = {} } = req.body;
  const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];
    if (validStatus.includes(status)) {
      return next();
    }
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`
    });
  }

function quantityOk(req, res, next) {
	const { data: { dishes } = {} } = req.body;

	for (let index = 0; index < dishes.length; index++){
		const amount = dishes[index].quantity;
		if (!amount || amount < 1 || !Number.isInteger(amount)) {
			return next({ status: 400, message: `dish ${index} must have a quantity that is an integer greater than 0` });
		}
	}
	
	return next();	
}

function idsMatch(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { orderId } = req.params;

  if (!id || id === "" || id === null) {
    return next();
  }

  if (id === orderId) {
    return next();
  }

  res.status(400).json({ error: `Order id does not match: ${id}` });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(), 
    deliverTo,
    mobileNumber,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder }); 
}

function update(req, res) {

	if (res.locals.order === null) {
    return res.status(404).json({ error: `Order id not found: ${req.params.orderId}` });
  }
	
    const foundOrder = res.locals.order;
    const { data: { name, description, price, image_url, deliverTo } = {} } = req.body;
  
    // Update the order
    foundOrder.name = name;
    foundOrder.description = description;
    foundOrder.price = price;
    foundOrder.image_url = image_url;
	foundOrder.deliverTo = deliverTo;
      
    res.json({ data: foundOrder });
  }

function destroy(req, res) {
  const { orderId } = req.params;
  if (res.locals.order === null) {
		return res.status(404).json({ error: `Order id not found: ${req.params.orderId}` });
	}
  if (res.locals.order.status !== "pending") {
    return res.status(400).json({ error: `pending` });
  }
  const index = orders.findIndex((order) => order.id === Number(orderId));
  // `splice()` returns an array of the deleted elements, even if it is one element
  const deletedOrder = orders.splice(index, 1)[0];
  res.sendStatus(204);
}

module.exports = {
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
		dishesArrayIsOk,
		quantityOk,
        create
    ],
    list,
    read: [orderExists, read],
    update: [
        orderExists,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
		dishesArrayIsOk,
		quantityOk,
		idsMatch,
		orderStatusOk,
		update
    ],
    delete: [
		orderExists, 
	    destroy
	],
  };
