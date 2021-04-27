const express = require('express');
const router = express.Router();
const {body, validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const auth = require('../../middleware/auth');
const User = require('../../models/User');

// @route    GET api/auth
// @desc     Get auth user
// @access   Private
router.get('/', auth, async (req,res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route    POST api/auth
// @desc     Authenticate user & get token
// @access   Public 
router.post('/',[
    body('email', 'Email is required').isEmail(),
    body('password', 'Please enter password with minimum 6 characters').exists()
    ],
    async (req,res) => {
            const errors = validationResult(req);
            if(!errors.isEmpty()){
                return res.status(400).json({errors:errors.array()})
            }
            const {email, password} = req.body;

            try{
                // See if user exist
                let user = await User.findOne({email});
                if (!user){
                    return res.status(400).json({errors:[{msg: 'Invalid credentials'}]});
                }

                // Compare password
                const isMatch = await bcrypt.compare(password, user.password)

                if(!isMatch) {
                    return res.status(400).json({errors:[{msg: 'Invalid credentials'}]});
                }

                // Return JWT
                const payload = {
                    user: {
                        id:user.id
                    }
                };
                jwt.sign(payload, config.get('jwtSecret'), {expiresIn: 360000},(err, token) => {
                    if(err) throw err;
                    res.json({token});
                });
            }
            catch(err) {
                console.error(err.message);
                res.status(500).send('Server error')
            }
            
});

module.exports = router;