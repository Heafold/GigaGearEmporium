require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const multer = require('multer');
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});
const upload = multer({ storage: storage });
const Admin = require('./models/Admin');
const Product = require('./models/Product');
const Order = require('./models/Order');
const app = express();
const port = 3000;


mongoose.connect(process.env.DB_MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connecté à MongoDB'))
  .catch(err => console.error('Erreur de connexion à MongoDB:', err));

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'public', 'views'));

app.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const adminAuth = (req, res, next) => {
  if (req.session.isAdmin) {
    next();
  } else {
    res.redirect('/login');
  }
};


app.get('/login', (req, res) => {
  res.render('admin/login');
});


app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({ username });

  if (admin && await bcrypt.compare(password, admin.password)) {
    req.session.isAdmin = true;
    res.redirect('/admin');
  } else {
    res.redirect('/login');
  }
});


app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Erreur lors de la déconnexion:', err);
      res.redirect('/admin');
    } else {
      res.clearCookie('connect.sid'); 
      res.redirect('/');
    }
  });
});



app.get('/admin', adminAuth, (req, res) => {
  res.render('admin/admin'); 
});

app.get('/admin/products', adminAuth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    const products = await Product.find()
      .skip((page - 1) * limit)
      .limit(limit);

    const totalProducts = await Product.countDocuments();
    const totalPages = Math.ceil(totalProducts / limit);

    res.render('admin/products', { products, page, totalPages });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error);
    res.status(500).send('Erreur serveur');
  }
});

app.get('/admin/orders', adminAuth, async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;

  try {
    const totalOrders = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);
    const orders = await Order.find()
                              .sort({ _id: -1 })
                              .skip((page - 1) * limit)
                              .limit(limit)
                              .lean();

    res.render('admin/orders', { orders, page, totalPages });
  } catch (error) {
    console.error('Erreur lors de la récupération des commandes:', error);
    res.status(500).send('Erreur serveur');
  }
});

app.get('/admin/orders/:orderId/process', adminAuth, async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).send('Commande non trouvée');
    }

    order.status = 'Traitée';
    await order.save();

    res.redirect('/admin/orders');
  } catch (error) {
    console.error('Erreur lors du traitement de la commande:', error);
    res.status(500).send('Erreur serveur');
  }
});

app.get('/admin/products/new', adminAuth, (req, res) => {
  res.render('admin/newproduct');
});

app.post('/admin/products/new', adminAuth, upload.single('image'), async (req, res) => {
  const { name, category, price } = req.body;
  const imageUrl = req.file ? req.file.path : '';

  try {
    const product = new Product({
      name,
      category,
      price,
      imageUrl
    });

    await product.save();
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Erreur lors de la création du produit :', error);
    res.status(500).send('Erreur serveur');
  }
});

app.get('/admin/products/:productId/edit', adminAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).send('Produit non trouvé');
    }
    res.render('admin/editproduct', { product });
  } catch (error) {
    res.status(500).send('Erreur serveur');
  }
});

app.post('/admin/products/:productId/edit', adminAuth, upload.single('image'), async (req, res) => {
  const { name, category, price, currentImage } = req.body;
  let imageUrl = currentImage;

  if (req.file) {
    imageUrl = req.file.path;
  }

  try {
    await Product.findByIdAndUpdate(req.params.productId, {
      name,
      category,
      price,
      imageUrl
    });
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Erreur lors de la modification du produit:', error);
    res.status(500).send('Erreur serveur');
  }
});

app.get('/admin/products/:productId/delete', adminAuth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.productId);
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Erreur lors de la suppression du produit:', error);
    res.status(500).send('Erreur serveur');
  }
});

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/computers', async (req, res) => {
  const ordinateurs = await Product.find({ category: 'computer' });
  res.render('list-of-products', { produits: ordinateurs, titre: 'Ordinateurs', categorie: 'computers' });
});

app.get('/keyboards', async (req, res) => {
  const claviers = await Product.find({ category: 'keyboard' });
  res.render('list-of-products', { produits: claviers, titre: 'Claviers', categorie: 'keyboards' });
});

app.get('/mouses', async (req, res) => {
  const souris = await Product.find({ category: 'mouse' });
  res.render('list-of-products', { produits: souris, titre: 'Souris', categorie: 'mouses' });
});

app.get('/screens', async (req, res) => {
  const ecrans = await Product.find({ category: 'screen' });
  res.render('list-of-products', { produits: ecrans, titre: 'Écrans', categorie: 'screens' });
});


app.get('/search', async (req, res) => {
  const searchTerm = req.query.query;
  try {
    const searchResults = await Product.find({
      name: { $regex: new RegExp(searchTerm, 'i') }
    });

    res.render('list-of-results', {
      produits: searchResults,
      titre: `Résultats de recherche pour "${searchTerm}"`
    });
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).send('Erreur serveur');
  }
});

function initializeCart(req) {
  if (!req.session.cart) {
    req.session.cart = {};
  }
}

app.post('/add-to-cart', (req, res) => {
  const { productId, quantity } = req.body;
  initializeCart(req);
  
  req.session.cart[productId] = (req.session.cart[productId] || 0) + parseInt(quantity, 10);
  res.redirect('back');
});

app.post('/remove-from-cart', (req, res) => {
  const { productId } = req.body;
  if (req.session.cart && req.session.cart[productId]) {
    delete req.session.cart[productId];
  }

  res.redirect('/cart');
});

app.get('/cart', async (req, res) => {
  initializeCart(req);

  let cartItems = [];
  let total = 0;

  for (const [productId, quantity] of Object.entries(req.session.cart)) {
    try {
      const product = await Product.findById(productId);
      if (product) {
        const subtotal = product.price * quantity;
        total += subtotal;
        cartItems.push({ ...product.toObject(), quantity, subtotal });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des détails du produit:', error);
    }
  }

  res.render('cart', { cartItems, total });
});

app.get('/checkout', (req, res) => {
  if (!req.session.cart || Object.keys(req.session.cart).length === 0) {
    return res.redirect('/cart');
  }
  res.render('checkout');
});

app.post('/checkout', async (req, res) => {
  const { address } = req.body;
  const cartItems = req.session.cart;

  try {
    const orderProducts = await Promise.all(
      Object.keys(cartItems).map(async (productId) => {
        const product = await Product.findById(productId);
        return {
          product: productId,
          name: product.name,
          quantity: cartItems[productId]
        };
      })
    );

    const newOrder = new Order({
      address,
      products: orderProducts,
      status: 'En attente'
    });

    await newOrder.save();
    req.session.cart = {};
    res.redirect('/order-success');
  } catch (error) {
    console.error('Erreur lors de la création de la commande:', error);
    res.status(500).send('Erreur lors de la création de la commande');
  }
});

app.get('/order-success', (req, res) => {
  res.render('order-success');
});

app.listen(port, () => {
  console.log(`Le serveur est en marche sur le port ${port}`);
});
