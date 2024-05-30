const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

/*
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find(dish => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  res.locals.dish = null;
  next();
}
*/

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find(dish => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  const error = new Error(`Dish id not found: ${dishId}`);
  //res.locals.dish = null;
  error.status = 404;
  next(error);
}

function read(req, res) {
  if (res.locals.dish) {
    res.json({ data: res.locals.dish });
  } else {
    res.status(404).json({ error: `Dish id not found: ${req.params.dishId}` });
  }
}

function list(req, res) {
  res.json({ data: dishes });
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

function priceIsGreaterThanZero(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (typeof price === 'number' && price > 0) {
    return next();
  }
  next({
    status: 400,
    message: `price`,
  });
}

function idsMatch(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { dishId } = req.params;

  if (!id || id === "" || id === null) {
    return next();
  }

  if (id === dishId) {
    return next();
  }

  res.status(400).json({ error: `Dish id does not match: ${id}` });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    "id": nextId(), 
    "name": name,
    "description": description,
    "price": price,
    "image_url": image_url
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function update(req, res) {
  if (res.locals.dish) {
    const foundDish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;

    // Update the dish
    foundDish.name = name;
    foundDish.description = description;
    foundDish.price = price;
    foundDish.image_url = image_url;

    res.json({ data: foundDish });
  } else {
    next();
  }
}

module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
		priceIsGreaterThanZero,
        create
    ],
    list,
    read: [dishExists, read],
    update: [
		dishExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
		priceIsGreaterThanZero,
		idsMatch,
        update
    ],
    //delete: [pasteExists, destroy],
  };
