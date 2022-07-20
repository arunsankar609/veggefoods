var express = require('express');
const otp = require('../config/otp');
const { append } = require('express/lib/response');
const { response } = require('../app');
const client = require('twilio')(otp.accountSID, otp.authToken);
const paypal = require('paypal-rest-sdk');
const shortid = require('shortid');
var router = express.Router();
var userHelper=require('../helpers/user-helper')
var productHelper=require('../helpers/product-helpers');
const async = require('hbs/lib/async');
const { Db } = require('mongodb');

const verifyLogin=(req,res,next)=>{
  
  if(req.session.loggedIn){
    next()
  }else{
res.redirect('/user/login')

}
}



/* GET home page. */
router.get('/',async function(req, res, next) {
  let user=req.session.user
  if (user)
  console.log(user)
  let refer=await userHelper.getAllusers()
  console.log('22222222222333333333');
  console.log(refer);
  let ban=await productHelper.getAllbanners()
  productHelper.getAllproducts().then((products)=>{
    res.render('index', {user,products,ban});
  })
  
});

router.get('/otp', function(req, res, next) {
  
  res.render('admin/otp');
  
});

router.get('/signup', function(req, res, next) {
  
  res.render('user/signup');
});

router.post('/signup',function(req,res){
  // otptextMessage()
  console.log(req.body)
  refferalId =shortid.generate()
  console.log('generateeeeeeeeeeeeeeeeeeeeeeeee');
  console.log(refferalId);
  var Number = req.body.number
  let refferal=req.body.referal

  console.log('refelzzzzzzzzzzzzzzzz');
  console.log(refferal);
  

      req.session.phone=Number
      req.session.userdata=req.body
      // Delete this after refferal checking
      userHelper.doSignup( req.session.userdata,refferalId).then(async(data)=>{
        console.log('ssssssssssssss');
        console.log(req.session.userdata.email);
        let admin=await productHelper.getAdminData()
userHelper.referalChecking( req.session.userdata.email,refferal,admin._id)

        res.redirect('/user/login')
       
      })
      // Delete this after refferal checking

      // client.verify
      // .services(otp.serviseSID) 
      // .verifications
      // .create({
      //   to:`+91${Number}`,
      //   channel:'sms'
      // })
      // .then((data)=>{
      
       
      
      //   // let user=req.session.userr
        
      //   res.redirect('/user/otp')
      // })
     // res.redirect('/user/otp')
  
})

// router.post('/otp-varify',(req,res)=>{
//   var Number = req.session.phone
//  console.log( "itho"+Number);
//  var otps = req.body.number
 
 

//  client.verify
//    .services(otp.serviseSID)
//    .verificationChecks.create({
//      to: `+91${Number}`,
//      code: otps
//    })
//    .then((data) => {
//      console.log(data.status + "otp status/*/*/*/");
//      if(data.status=='approved'){
//        userHelper.doSignup( req.session.userdata,refferalId).then((response)=>{
         

//          res.redirect('/user/login')
        
//        })
      
   
//      }else{
       
//        otpErr = 'Invalid OTP'
//        res.redirect('user/otp',{otpErr,Number})
//      }
  
// });

// })


router.get('/login', function(req, res, next) {
  
  res.render('user/login',{show:req.session.show,block:req.session.block});
  req.session.show=false
    req.session.block=false

});

router.post('/login', function(req, res, next) {
  userHelper.dologin(req.body).then((response)=>{
    console.log(req.body)

       
    if(response.status){
      if(response.user.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/') 
      } else {
        req.session.block=true
        res.redirect('user/login')
        
      }
  }
  else{
  
    req.session.show=true
          res.redirect('user/login')

  }
  
     
    
  })
 
});

router.get('/logout', function(req, res, next) {
  req.session.destroy()
  res.redirect('/')
});
router.get('/shop',verifyLogin,async function(req, res, next) {
  let cartCount=null
  if(req.session.user){
  cartCount=await userHelper.getCartCount(req.session.user._id)
  
}
console.log(cartCount)
  productHelper.getAllproducts().then((products)=>{
    
    res.render('shop',{products,user:req.session.user,cartCount}); 
   
  }) 
 
});
router.get('/cart',verifyLogin,async(req,res,next)=>{
let offerPro=await userHelper.getOfferTotalAmount(req.session.user._id)
let products=await userHelper.getCartProducts(req.session.user._id)
let totalValue=await userHelper.getTotalAmount(req.session.user._id)
userHelper.getCouponUser(req.session.user._id).then((coupon)=>{

 if(coupon){
   userHelper.getAppliedCoupon(coupon).then((coup)=>{
   couponDis=(offerPro*coup.offerpercent)/100
     afCoup=offerPro-couponDis;
     offerPro=afCoup
    res.render('user/cart',{products,user:req.session.user,totalValue,couponDis,offerPro,'coupErr':req.session.coupErr})
    req.session.coupErr=""
    console.log('coupon applied');

   })
 }else{
   res.render('user/cart',{products,user:req.session.user,totalValue,offerPro,'coupErr':req.session.coupErr})
  req.session.coupErr=""
  console.log('no coupon applied');
 }
})

  
    

 
})
router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  console.log('api call')
  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
   
  })

})
router.post('/change-product-quantity',(req,res,next)=>{
userHelper.changeProductQuantity(req.body).then(async(response)=>{
  response.total= await userHelper.getTotalAmount(req.body.user)
  response.offerPro=await userHelper.getOfferTotalAmount(req.session.user._id)
  let coup=await userHelper.getCouponUser(req.session.user._id)
  
 if(coup){
    response.coup=await userHelper.getAppliedCoupon(coup)
    console.log('88888888888888888');

 response.coupDis=(response.offerPro*response.coup.offerpercent)/100
 response.finalCoup=response.offerPro-response.coupDis
 response.disCoup=response.coupDis
 response.offerPro=response.finalCoup
 res.json(response)
   
      
 }else{
   console.log('111111111111111111111');
  res.json(response)

 }
  //await userHelper.getAppliedCoupon(coupon).
 
  
})
})
router.post('/remove-product',(req,res,next)=>{
  userHelper.deleteCartProduct(req.body).then((response)=>{
    res.json(response)
    
  })
  })

  router.get('/checkout',verifyLogin,async(req,res)=>{
   let address= await userHelper.getUserAddress(req.session.user._id)
   await userHelper.getTotalAmount(req.session.user._id).then(async(total)=>{
      let offerPro=await userHelper.getOfferTotalAmount(req.session.user._id)
      walletZ=await userHelper.userProfile(req.session.user._id)
      userwallet=walletZ.wallet
      appliedwallet=walletZ.appliedWallet
      
      let checkwallet= await userHelper.checkWalletAmount(userwallet,offerPro,req.session.user._id)
     if (req.session.wallet){
      total=req.session.wallet
     }else{
      total=offerPro
     }
      
      let coup=await userHelper.getCouponUser(req.session.user._id)
      if(coup){
       let coupo= await userHelper.getAppliedCoupon(coup)
        console.log(coupo.offerpercent);
       cAmount=(total*coupo.offerpercent)/100
        total=total-cAmount
        // let appliedwallet=await userHelper.findAppliedWallet(req.session.user._id)
      res.render('user/checkout',{total,user:req.session.user,address,userwallet,walletZ,checkwallet})
      }else{
      res.render('user/checkout',{total,user:req.session.user,address,userwallet,walletZ,checkwallet})
      }
    })
   
  })
router.post('/checkout',async(req,res)=>{
  let products=await userHelper.getCartProductsList(req.body.userId)
  let offerPro=await userHelper.getOfferTotalAmount(req.session.user._id)
  console.log(products)
  let totalAmount=await userHelper.getTotalAmount(req.body.userId)
  if (req.session.wallet){
    totalAmount=req.session.wallet
   }else{
    totalAmount=offerPro
   }
  
  let coup=await userHelper.getCouponUser(req.session.user._id)
  if(coup){
    let coupo= await userHelper.getAppliedCoupon(coup)
    cAmount=(totalAmount*coupo.offerpercent)/100
    totalAmount=totalAmount-cAmount
    console.log('zwwwwwwwwwwwwwwwwwww');
    console.log(totalAmount);
 
  userHelper.placeOrder(req.body,totalAmount,products,offerPro).then((orderId)=>{ 
    req.session.orderId=orderId.insertedId
    console.log('ZZoderrrrrrrr');
    console.log(req.session.orderId);

    //response.status=true

    if(req.body['payment-method']==='COD'){
     orderId.status='COD'
    
res.json(orderId)
    }
else if(req.body['payment-method']==='Wallet'){
  userHelper.userWalletPayment(req.session.user._id,totalAmount).then((response)=>{
    response.status='Wallet'
    res.json(response)
  })

}
    else if(req.body['payment-method']==='Paypal'){
      userHelper.generatePaypal(orderId.insertedId,totalAmount).then((response)=>{
        
        response.status='Paypal'
res.json(response)
      })
      }
    else{
      
      userHelper.generateRazorpay(orderId.insertedId,totalAmount).then((response)=>{
        
        response.status='ONLINE'
res.json(response)
      })

    }
  })
}else{
  userHelper.placeOrder(req.body,totalAmount,products,offerPro).then((orderId)=>{ 
    req.session.orderId=orderId.insertedId
    console.log('ZZoderrrrrrrr');
    console.log(req.session.orderId);
    req.session.wallet=null
    //response.status=true

    if(req.body['payment-method']==='COD'){
     orderId.status='COD'
    
res.json(orderId)
    }
else if(req.body['payment-method']==='Wallet'){
  userHelper.userWalletPayment(req.session.user._id,totalAmount).then((response)=>{
    response.status='Wallet'
    res.json(response)
  })

}
    else if(req.body['payment-method']==='Paypal'){
      userHelper.generatePaypal(orderId.insertedId,totalAmount).then((response)=>{
        
        response.status='Paypal'
res.json(response)
      })
      }
    else{
      
      userHelper.generateRazorpay(orderId.insertedId,totalAmount).then((response)=>{
        
        response.status='ONLINE'
res.json(response)
      })

    }
  })

}
  
})

router.get('/successorder/:id',async(req,res)=>{
  let orders=await userHelper.getUserOrders(req.params.id)
  
  console.log(orders)
  res.render('user/ordersuccess',{user:req.session.user,orders})
})

router.get('/successorder',async(req,res)=>{
    let status=await userHelper.changePaymentStatus(req.session.orderId)
  let orders=await userHelper.getUserOrders(req.session.orderId)
  console.log(orders)
  res.render('user/ordersuccess',{user:req.session.user,orders,status})
})

router.get('/orderedproducts/:id',async(req,res)=>{
   let products=await userHelper.getOrderedProducts(req.params.id)
   console.log('qwqwqqwqwqwqwq');
   console.log(products);
  console.log(req.params.id)
  res.render('user/orderedproducts',{user:req.session.user,products})
})

router.get('/viewallproducts',async(req,res)=>{
  let products=await userHelper.viewOrderedProducts(req.session.user._id)
  console.log(products)
  res.render('user/viewallorders',{products,user:req.session.user})
})

router.get('/cancelorder/:id', function(req, res, next) {
  userHelper.cancelOrders(req.params.id).then(async()=>{
   let amount=await userHelper.getOrderedAmount(req.params.id)
   
    amount=amount.totalAmount
    console.log(amount);
    userHelper.addMoney(req.session.user._id,amount)
    
    res.redirect('/viewallproducts');
  })
  });

  router.get('/userprofile',verifyLogin,async(req,res)=>{
    
    userHelper.userProfile(req.session.user._id).then((userprofile)=>{
     
      console.log(userprofile)
 res.render('user/userprofile',{userprofile,user:req.session.user})

    })
  })

  router.post('/verify-payment',(req,res)=>{
    console.log(req.body)
    userHelper.verifyPayment(req.body).then(()=>{
      userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
        console.log('payment successfull')
       let response={ 
          orderId:req.body['order[receipt]'],
          status:true
        }
        console.log(response)
        res.json(response)
      })
      
    }).catch((err)=>{
      console.log(err)
      res.json({status:false})
    })

  }),
  router.post('/edit-userprofile/:id',(req,res)=>{
    userHelper.editUserProfile(req.params.id,req.body).then(()=>{
      res.redirect('/userprofile')

    })

  }),
  router.post('/changepassword',(req,res)=>{
    userHelper.changePassword(req.session.user._id,req.body).then((response)=>{
      if(response.status){
        res.redirect('/userprofile')

      }else{
        response.status=false
        res.redirect('/userprofile')
      }
      
      
    })
  })
  router.post('/addAddress',(req,res)=>{
    userHelper.addAddress(req.session.user._id,req.body).then(()=>{
      res.redirect('/userprofile')
    })
  })

  router.get('/getaddressdetails',(req,res)=>{
    userHelper.getUserAddress(req.session.user._id).then(()=>{
      
      
    })
  })
  
    router.get('/success',async (req, res) => {
      let totalValue=await userHelper.getOrderedAmount(req.session.orderId)
     
      totalValue= totalValue.totalAmount
      
    console.log(totalValue);
      const payerId = req.query.PayerID;
      const paymentId = req.query.paymentId;
    
      const execute_payment_json = {
        "payer_id": payerId,
        "transactions": [{
            "amount": {
                "currency": "USD",
                "total": totalValue
            }
        }]
      };
    
      paypal.payment.execute(paymentId, execute_payment_json, async function (error, payment) {
        if (error) {
            console.log(error.response);
            throw error;
        } else {
            console.log(JSON.stringify(payment));
   
            res.redirect('/successorder')
        }
    });
    });
  
router.get('/downloadinvoice',async(req,res)=>{
   res.redirect('/successorder')
  })


  
 
  
  router.post('/add-money',(req,res)=>{
    userHelper.addMoney(req.session.user._id,req.body.amount).then(()=>{
      res.redirect('/userprofile')
    })
  })

  router.post('/choose-address/:id',async(req,res)=>{
  await  userHelper.selectedAddress(req.params.id).then((response)=>{
      console.log('xxzxzzxzz');
      console.log(req.params.id);
   response.user=req.session.user._id
      
      res.json(response)
    })
  })

  router.post('/apply-coupon',(req,res)=>{
  userHelper.applyCoupon(req.body,req.session.user._id).then((response)=>{
    
     
     if(response.status){
      response.status=true
      req.session.coupErr='Coupon Applied'
       res.json(response)
      
     }else{
      response.status=false
      req.session.coupErr='Coupon used/invalid'
      res.json(response)
     }
     
    })

  })
  router.get("/remove-coupon/:id",(req,res)=>{
productHelper.removeCouponOffer(req.params.id).then(()=>{
  res.redirect('/cart')
})
  })

  router.get("/redeem-wallet/:id",async(req,res)=>{
    let offerPro=await userHelper.getOfferTotalAmount(req.session.user._id)
    walletZ=await userHelper.userProfile(req.session.user._id)
      userwallet=walletZ.wallet
      final=offerPro-userwallet
      req.session.wallet=final
    userHelper.redeemWallet(req.params.id).then((final)=>{

      res.redirect('/checkout') 
    })
  })

  



module.exports = router;
