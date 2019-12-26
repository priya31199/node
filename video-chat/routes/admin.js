var express = require('express');
var router = express.Router();
var db = require('../db');
var bodyParser = require('body-parser');
var user = require('../models/users');
const { check, validationResult } = require('express-validator');
//const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const checkAuth = require('../middleware/check-auth');

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended: true}));

/* GET users listing. */
router.get('/', function(req, res, next) {

    var sql = "select id, name, username, type from admin";
    // db.query(sql, function(err, rows, fields) {
        db.query(sql, function(err, rows) {
        if (err) {
            res.status(500).send({
                error: 'something failed'
            })
        }
        // res.status(200).json({
        //     message: 'Admin list',
        //     data: rows
        // })
        const  response = {
            count: rows.length,
            data: rows
        }
        res.json(rows);
    });
});

router.get('/:username', checkAuth, function(req, res, next) {
    var username = req.params.username;
    var sql = `select * from admin where BINARY username = "${username}"`;
    db.query(sql, function(err, row, fields) {
        if (err) {
            res.status(500).send({
                error: 'something failed',
                uname: username
            })
        }
        res.json(row[0]);
    });
});

//inser user in admin
router.post('/insert', checkAuth, [
    check('name').not().isEmpty().withMessage('name is empty'),
    // username must be an email
    check('username').not().isEmpty().withMessage('username is empty'),
    // password must be at least 5 chars long
    check('password').isLength({ min: 5 }).withMessage('must be at least 5 chars long'),
    check('type').not().isEmpty().isInt().withMessage('must be integer')
  ],
   function(req, res, next) {

    const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

//   bcrypt.hash(req.body.password, 10, (err, hash) => {
//     if (err) {
//         return res.status(500).json({
//             error: err
//         });
//     } else {
//         user = {
//             name: req.body.name,
//             username: req.body.username,
//             password: hash,
//             type: req.body.type
//         }
//     }
// })

user = {
    name: req.body.name,
    username: req.body.username,
    password: req.body.password,
    type: req.body.type
}
    
    

    var sql = `insert into admin (name, username, password, type) 
    value("${user.name}", "${user.username}", "${user.password}", "${user.type}")`;
    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({
                message: 'something failed',
                error: err
            })
        }
        res.status(201).json({
            message: "inserted sucessfully",
            id: result.insertId
        })
    });
    
});

/* admin login. */
router.post('/login', [
    // username must be an email
    check('username').not().isEmpty().withMessage('username is empty'),
    // password must be at least 5 chars long
    check('password').not().isEmpty().withMessage('password is empty'),
    check('password').isLength({ min: 5 }).withMessage('must be at least 5 chars long'),
  ], function(req, res, next) {

    const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }


    const user = {
        username: req.body.username,
        password: req.body.password
    }

    var sql = `select * from admin where BINARY username = "${user.username}"`;
    db.query(sql, function(err, result) {
        if (err) {
            res.status(500).send({
                message: 'something failed',
                error: err
            })
        }
        if (result.length > 0) {

            if(user.password == result[0].password) {

                const token = jwt.sign({
                    username: result[0].username,
                    user_id: result[0].id
                }, 
                process.env.JWT_KEY, 
                {
                    expiresIn: "1h"
                }
                );
                res.status(200).json({
                    message: 'Auth Succesfull',
                    token: token,
                    data: result
                })
            } else {
                res.status(401).json({
                    message: 'Auth Failed',
                })
            }
        } else {
            res.status(401).json({
                message: 'Auth Failed',
            })
        }
        
    });
    
});

module.exports = router;
