const express = require('express');
const session = require('express-session');
const MongodbSession = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const app = express();
const bcrypt = require('bcryptjs');
const UserModel = require('./models/User');

const mongodbUri = 'mongodb://localhost:27017/sessions';

mongoose.connect(mongodbUri, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
}).then(res => console.log('Mongodb connect success'))
    .catch(err => console.log('Error connecting to mongodb: ', err.message))

const store = new MongodbSession({
    uri: mongodbUri,
    collection: 'mySessions'
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({extended: true}));

app.use(session({
    secret: 'key that will sign cookie',
    resave: false,
    saveUninitialized: false,
    store
}));

const isAuth = (req, res, next) => {
    if(req.session.isAuth)
        next()
    else
        res.redirect('/login');
};

app.get('/', (req, res) => {
    res.render('landing');
});

app.get('/login', (req,res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    const {email, password} = req.body;

    const user = await UserModel.findOne({email});
    if (!user)
        return res.redirect('/login');

    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch)
        return res.redirect('/login');

    req.session.isAuth = true;
    res.redirect('/dashboard');
});

app.get('/register', (req, res) => {
    res.render('register')
});

app.post('/register', async (req, res) => {
    const {username, email, password} = req.body;

    let user = await UserModel.findOne({email});
    if (user)
        return res.redirect('/register');

    const hashedPassword = await bcrypt.hash(password, 12);

    user = new UserModel({
        username,
        email,
        password: hashedPassword
    });

    await user.save();

    res.redirect('/login');
});

app.get('/dashboard', isAuth, (req, res) => {
    res.render('dashboard');
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err)
            throw err;

        res.redirect('/landing');
    });
});

app.listen(5000, () => console.log('Server listening on port http://localhost:5000'));