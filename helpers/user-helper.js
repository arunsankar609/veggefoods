
var db=require('../config/connection')
var collection=require('../config/collection');
const { promise, reject } = require('bcrypt/promises');
const async = require('hbs/lib/async');
const bcrypt=require('bcrypt');
const { USER_COLLECTION, ORDER_COLLECTION } = require('../config/collection');
const { response } = require('../app');
const objectId=require('mongodb').ObjectId
const Razorpay = require('razorpay');
const fs=require('fs')
var easyinvoice = require('easyinvoice');
const { resolve } = require('node:path');
const { stat } = require('node:fs');
const { status } = require('express/lib/response');

const paypal = require('paypal-rest-sdk');

var instance = new Razorpay({
  key_id: 'rzp_test_8eBS6jXdIgoHLk',
  key_secret: 'vIoYxb1OEOzKw9AqzKh4Ciqb',
});


paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'AWCLIqOFBbaPHFqgEbQ4OiA5KapA6HbcJVOgRbVygg1KbmG7B_HnuwTh1kP4HlFw8u6x9JTmzGn8rucc',
    'client_secret': 'ELQnzWWR4MTfq0uSFOTkKCzWDMcuuNmaH3_6s6rr8HViA93GjHgtA7uUNSVgSy60KXZ6ctt712EvIWRe'
  });



module.exports={
    doSignup: (userData,refferalId) => {
      console.log('zzzzzzzz0000000');
      console.log(refferalId);
      userData.refferalId=refferalId
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            //userData.confirm_password = await bcrypt.hash(userData.confirm_password, 10)
            userData.status=true 
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data)
            })

         
        })
}
,
    dologin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let loginStatus=false
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            if(user){
                bcrypt.compare(userData.password,user.password).then((status)=>{
                    if(status){
                        console.log("login success")
                        response.user=user;
                        response.status=true
                        resolve(response)
                    }else{
                        
                        resolve({status:false})
                        console.log("login failed")
                    }  
                })
            }else{
                console.log("Login failed");
                resolve({status:false})
            }
        })
    },
    adminSignup:(adminCred)=>{
        return new Promise(async(resolve,reject)=>{
            adminCred.password = await bcrypt.hash(adminCred.password, 10)
            db.get().collection(collection.ADMIN_CRED).insertOne(adminCred).then(()=>{
                resolve()
            })
        })

    },
    adminLogin:(adminLog)=>{
        return new Promise(async(resolve,reject)=>{
            console.log('wewewewewe');
            console.log(adminLog);
            let response={}
            let admin=await db.get().collection(collection.ADMIN_CRED).findOne({username:adminLog.email})
            if(admin){
                bcrypt.compare(adminLog.password,admin.password).then((status)=>{

                    if(status){
                        response.status=true
                        resolve(response)
                    }else{
                        response.status=false
                        resolve(response)
                    }
                })
            }
        })

    },
    getAllusers:()=>{

        return new Promise(async(resolve,reject)=>{
            let user=await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(user)

        })

    },
    blockUsers:(userId)=>{
        console.log(userId)
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne( {_id:objectId(userId)},{$set:{status:false}}).then((data)=>{
                resolve(data)
            })
        })
    },
    unblockUsers:(userId)=>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).updateOne( {_id:objectId(userId)},{$set:{status:true}}).then((data)=>{
                resolve(data)
            })
        })

        },
    addToCart:(proId,userId)=>{ 
        let proObj={
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
           let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
           if(userCart){
               let proExist=userCart.product.findIndex(product=>product.item==proId)
               console.log(proExist)
               if(proExist!=-1){
                   db.get().collection(collection.CART_COLLECTION).
                   updateOne({user:objectId(userId),'product.item':objectId(proId)},
                   {
                       $inc:{'product.$.quantity':1}
                       
                   }).then((response)=>{
                    resolve()
                    })
                   
               }else{
              

            db.get().collection(collection.CART_COLLECTION)
            .updateOne({user:objectId(userId)},{$push:{product:proObj}}).then((response)=>{
            resolve()
            })
        }

           }else{
               let cartObj={
                   user:objectId(userId),
                   product:[proObj]
               }
               db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then(()=>{
                   resolve()
               })
           }

        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
           let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
               {
                   $match:{user:objectId(userId)}
               },
               {
                   $unwind:'$product'
               },
               {
                  $project:{
                      item:'$product.item',
                      quantity:'$product.quantity'
                  } 
               },
               {
                   $lookup:{
                       from:collection.PRODUCT_COLLECTION,
                       localField:'item',
                       foreignField:'_id',
                       as:'product'

                   }
               },
               {
                   $project:{
                       item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                   }
               }
            
           ]).toArray()
        // console.log(cartItems[0].product)
           resolve(cartItems)
        }) 
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
                count=cart.product.length
                resolve(count)
            }else{
                resolve()
            }

            
        })
    },
    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
return new Promise((resolve,reject)=>{
    if(details.count==-1 && details.quantity==1){
        db.get().collection(collection.CART_COLLECTION).
        updateOne({_id:objectId(details.cart)},
        {
            $pull:{product:{item:objectId(details.product)}}
        }).then((response)=>{

            resolve({removeProduct:true})

        })
    }else{
db.get().collection(collection.CART_COLLECTION).
    updateOne({_id:objectId(details.cart),'product.item':objectId(details.product)},
    {
        $inc:{'product.$.quantity':details.count}
        
    }).then((response)=>{
     resolve({status:true})
     })
    }
})

    },
    deleteCartProduct: ( details ) => {
        
        return new Promise((resolve, reject) => {
           

                db.get().collection(collection.CART_COLLECTION).updateOne({ _id:objectId(details.cart) },
                    {
                        $pull: { product: { item:objectId(details.product) } }
                    }).then((response) => {
                        resolve({removeProduct:true})

                    }) 
                
            })
        },
        getTotalAmount:(userId)=>{
            return new Promise(async(resolve,reject)=>{
                let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match:{user:objectId(userId)}
                    },
                    {
                        $unwind:'$product'
                    },
                    {
                       $project:{
                           item:'$product.item',
                           quantity:'$product.quantity'
                       } 
                    },
                    {
                        $lookup:{
                            from:collection.PRODUCT_COLLECTION,
                            localField:'item',
                            foreignField:'_id',
                            as:'product'
     
                        }
                    },
                    {
                        $project:{
                            item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                        }
                    },
                    {
                       $group:{_id:null,
                           total:{$sum:{$multiply: ['$quantity', {$toInt: '$product.price'}]}}
                       } 
                    }
                 
                ]).toArray()
             if(total[0]){
                resolve(total[0].total)
             }else{
                 resolve(0)
             }
               
             }) 
            
        },
         getOfferTotalAmount:(userId)=>{
            return new Promise(async(resolve,reject)=>{
                let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match:{user:objectId(userId)}
                    },
                    {
                        $unwind:'$product'
                    },
                    {
                       $project:{
                           item:'$product.item',
                           quantity:'$product.quantity'
                       } 
                    },
                    {
                        $lookup:{
                            from:collection.PRODUCT_COLLECTION,
                            localField:'item',
                            foreignField:'_id',
                            as:'product'
     
                        }
                    },
                    {
                        $project:{
                            item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                        }
                    },
                    {
                        $project:{
                            item:1,quantity:1,product:1,subtotal:{$cond:{if:('$product.status'),then:{
                                $sum:{$multiply: ['$quantity', {$toInt: '$product.disPrice'}]}
                            },else:{$sum:{$multiply: ['$quantity', {$toInt: '$product.price'}]}}
                        }}
                        }
                    },
                    {

                       $group:{_id:null,
                           total:{$sum:'$subtotal'}
                       } 
                    }
                 
                ]).toArray()
             if(total[0]){
                resolve(total[0].total)
             }else{
                 resolve(0)
             }
               
             }) 
            
        },

        placeOrder:(order,total,products,finaltotal)=>{
            console.log('rrrrrrrrrrrrrrr');
            console.log(order.userId);
            return new Promise((resolve,reject)=>{
                console.log(order,total,products)
                let status=order['payment-method']==='COD'?'placed':'pending'
                let orderUser={
                    deliveryDetails:{
                    name:order.username,
                    address:order.address,
                    pin:order.pincode

                    },
                    userId:objectId(order.userId),
                    paymentMethod:order['payment-method'],
                    products:products,
                    totalAmount:total,
                    status:status,
                    date:new Date().toDateString(),
                    time:new Date()
                }
                db.get().collection(collection.ORDER_COLLECTION).insertOne(orderUser).then(async(response)=>{
                    db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(order.userId)})
                await db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(order.userId)},
                    
                    {
                        $unset:{
                            coupon:'0',
                            appliedWallet:'0'
                        }
                    })
                    orderUser.status=true
                    resolve(response)
                })
                
            })
        },
        getCartProductsList:(userId)=>{
            console.log(userId)
            return new Promise(async(resolve,reject)=>{
                let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})

                    if(cart){
                        resolve(cart.product)

                    }else{
                        resolve()
                    }
                
                    
                
                })
             
                
                
            

        },
        getUserOrders:(userId)=>{
            return new Promise((resolve,reject)=>{
                console.log(userId)
                 db.get().collection(collection.ORDER_COLLECTION).find({_id:objectId(userId)}).toArray().then((orders)=>{
 console.log(orders)
                    resolve(orders)
                 })
                   
                })
               
                
            
        },
        getOrderedProducts:(orderId)=>{
            return new Promise(async(resolve,reject)=>{
                let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match:{_id:objectId(orderId)}
                    },
                    {
                        $unwind:'$products'
                    },
                    {
                       $project:{
                           item:'$products.item',
                           quantity:'$products.quantity'
                       } 
                    },
                    {
                        $lookup:{
                            from:collection.PRODUCT_COLLECTION,
                            localField:'item',
                            foreignField:'_id',
                            as:'product'
     
                        }
                    },
                    {
                        $project:{
                            item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                        }
                    }
                 
                ]).toArray()
             // console.log(cartItems[0].product)
           
             console.log(orderItems)
                resolve(orderItems)
             }) 
        },
        viewOrderedProducts:(userId)=>{
            return new Promise((resolve,reject)=>{
                console.log(userId)
                db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray().then((orders)=>{
                console.log(orders)
                    resolve(orders)
                 })
                   
                })

        },

        cancelOrders:(userId)=>{
            return new Promise ((resolve,reject)=>{
                db.get().collection(collection.ORDER_COLLECTION).updateOne( {_id:objectId(userId)},{$set:{cancelled:true}}).then((data)=>{
                    resolve(data)
                })
            })

        },
        userProfile:(userId)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)}).then((userProfile)=>{
                    resolve(userProfile)
                })

            })
        },
        generateRazorpay:(orderId,total)=>{
           
            return new Promise((resolve,reject)=>{
                var options ={
                    amount : total*100,
                    currency : "INR",
                    receipt :""+ orderId
                };
                instance.orders.create(options, function(err,order){
                    

                 console.log(order)
                        resolve(order)
                    
                  
                });
                  

            })

        },
        verifyPayment:(details)=>{
            return new Promise((resolve,reject)=>{
             let crypto = require('node:crypto');
            let hmac=crypto.createHmac('sha256', 'vIoYxb1OEOzKw9AqzKh4Ciqb');
                hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
                hmac=hmac.digest('hex')
                if(hmac==details['payment[razorpay_signature]']){
                    resolve()
                }else{
                    reject()
                }
            })

        },
        changePaymentStatus:(orderId)=>{
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({_id:objectId(orderId)},
                {
                    $set:{
                        status:'placed'
                    }
                }).then(()=>{
                    resolve()
                })

            })
        },
        editUserProfile:(userId,editProfile)=>{
            console.log('zzazazazaza');
            console.log(userId);
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
                {
                    $set:{
                        name:editProfile.name,
                        email:editProfile.email,
                        phone:editProfile.phone
                    }

                }).then(()=>{
resolve()
                })
            })
        },
        changePassword:(userId,hlo)=>{
            
            
            
            return new Promise(async(resolve,reject)=>{
              let  response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
            rpassword = await bcrypt.hash(hlo.newpassword,10)
            bcrypt.compare(hlo.hi,user.password).then((status)=>{
           if(status){
           db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
            {
                $set:{
                    password:rpassword,
                  
                }
            }).then(()=>{
                response.status=true
                
                
                resolve(response)
            })

                }else{
                    response.status=false
                    resolve(response)
                }
            
            
            })
            
        })
        },
        addAddress:(userId,address)=>{
            addrObj={
                userId,address
            }
            return new Promise((resolve,reject)=>{
                
                db.get().collection(collection.ADDRESS_COLLECTION).insertOne(addrObj).then((addrObj)=>{
                    resolve(addrObj)
                })
            })

        },

        getAllUserOrders:()=>{
            return new Promise(async(resolve,reject)=>{
              let orders=await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
              resolve(orders)
            })
        },
        changeStatusDelivered:(userId)=>{
            return new Promise ((resolve,reject)=>{
                db.get().collection(collection.ORDER_COLLECTION).updateOne( {_id:objectId(userId)},{$set:{status:'delivered'}}).then((data)=>{
                    resolve(data)
                })
            })
        },
        ChangeStatusShipped:(userId)=>{
            return new Promise ((resolve,reject)=>{
                db.get().collection(collection.ORDER_COLLECTION).updateOne( {_id:objectId(userId)},{$set:{status:'shipped'}}).then((data)=>{
                    resolve(data)
                })
            })

        },
        generatePaypal:(orderId,total)=>{
            return new Promise((resolve,reject)=>{
                
                    const create_payment_json = {
                      "intent": "sale",
                      "payer": {
                          "payment_method": "Paypal"
                      },
                      "redirect_urls": {
                          "return_url": "http://localhost:3000/success",
                          "cancel_url": "http://localhost:3000/cancel"
                      },
                      "transactions": [{
                          "item_list": {
                              "items": [{
                                  "name": "Red Sox Hat",
                                  "sku": "001",
                                  "price": total,
                                  "currency": "USD",
                                  "quantity": 1
                              }]
                          },
                          "amount": {
                              "currency": "USD",
                              "total": total
                          },
                          "description": "Hat for the best team ever"
                      }]
                  };
                  
                  paypal.payment.create(create_payment_json, function (error, payment) {
                    if (error) {
                        throw error;
                    } else {
                      resolve(payment)
                    }
                  });
                  
                  

            })

        },
       
        

        getOrderedAmount:(orderId)=>{
            
            return new Promise((resolve,reject)=>{
                db.get().collection(collection.ORDER_COLLECTION).findOne({_id:objectId(orderId)}).then((amount)=>{
                    resolve(amount)
                })

            })
        },


        addMoney:(userId,amount)=>{
            amound=parseInt(amount)
            return new Promise(async(resolve,reject)=>{
                let user= await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
                if(user.wallet){
                    db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
                    {
                        $inc:{wallet:amound}
                    }).then(()=>{
                        resolve()
                    })
                    

                }else{
                    db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
                        {$set:{wallet:amound}},
                    {

                    }).then(()=>{
                        resolve()
                    })
                    
                }
                
              
            })
        },
        getAdminOrderCount:()=>{
        return new Promise(async(resolve,reject)=>{
            let allordercount=  await  db.get().collection(collection.ORDER_COLLECTION).count()
                resolve(allordercount)
        
            })
        },
        getTotalCOD:()=>{
            return new Promise(async(resolve,reject)=>{
                //totalAmount=await db.get().collection(collection.ORDER_COLLECTION)
               let total= await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match:{
                            paymentMethod:"COD"
                            }
                        },
                        {
                            $group:{
                                _id:null,
                                total:{$sum:"$totalAmount"}
                            }
                        }
                    
                ]).toArray()
                
                console.log(total);
                resolve(total)
            })

        },
        getTotalRazorpay:()=>{
            return new Promise(async(resolve,reject)=>{
                //totalAmount=await db.get().collection(collection.ORDER_COLLECTION)
               let total= await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match:{
                            paymentMethod:"ONLINE"
                            }
                        },
                        {
                            $group:{
                                _id:null,
                                total:{$sum:"$totalAmount"}
                            }
                        }
                    
                ]).toArray()
                resolve(total)
            })

        },
        getTotalPaypal:()=>{
            return new Promise((resolve,reject)=>{
                let total= db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $match:{
                            paymentMethod:"Paypal"
                        }
                    },{
                        $group:{
                            _id:null,
                            total:{$sum:'$totalAmount'}
                        }
                    }
                ]).toArray()
                resolve(total)
            })
        },
        getAlltotalPayedAmount:()=>{
            return new Promise(async(resolve,reject)=>{
             let total= await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $group:{
                            _id:null,
                            total:{$sum:'$totalAmount'}

                        }
                    }
                ]).toArray()
                console.log(total);
                resolve(total)

            })
        },
        getUserAddress:(userId)=>{
            return new Promise(async(resolve,reject)=>{
                await db.get().collection(collection.ADDRESS_COLLECTION).find({userId}).toArray().then((getaddress)=>{
    
                    resolve(getaddress)
                })
               

            })
        },

        selectedAddress:(addressId)=>{
            
            return new Promise(async(resolve,reject)=>{
                await db.get().collection(collection.ADDRESS_COLLECTION).findOne({_id:objectId(addressId)}).then((response)=>{
                    
                    
                    resolve(response)
                })

            })
        },

        userWalletPayment:(userId,total)=>{
            return new Promise(async(resolve,reject)=>{
                let balance=await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
                
                balanceAmount=balance.wallet-total
                
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
                {
                    $set:{
                        wallet:balanceAmount
                    }
                }).then((response)=>{
                    resolve(response)
                })
               
            })

        },
        applyCoupon:(eCoupon,userId)=>{
            return new Promise(async(resolve,reject)=>{
            let response={}
                let dCoupon= await db.get().collection(collection.COUPON_COLLECTION).findOne({offercode:eCoupon.coupon})
                code=eCoupon.coupon
               if(dCoupon){
                   response.status=true
              let user= await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId),code})
              if(user){
                  response.status=false
                  resolve(response)
                  
              }
              else {
                response.status=true
                  db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
                  {
                      $set:{
                          coupon:code
                          
                      }
                  })
                //   db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
                //   {
                //       $set:{
                //         coupon:code
                //       }
                //   })
               resolve(response)
              }
                } else{
                    response.status=false
                    resolve(response)
                }
            })


        },
        getAppliedCoupon:(coupon)=>{
            return new Promise(async(resolve,reject)=>{
         let coup= await db.get().collection(collection.COUPON_COLLECTION).findOne({offercode:coupon})
resolve(coup)

            })
        },
        getCartCollections:(fcoup)=>{
            return new Promise((resolve,reject)=>{
        let coupon= db.get().collection(collection.CART_COLLECTION).findOne({coupon:fcoup})
        resolve(coupon)
                
            })
        },

        referalChecking:(userId,refferal,adminId)=>{
            return new Promise(async(resolve,reject)=>{
                let usersRef= await db.get().collection(collection.USER_COLLECTION).findOne({refferalId:refferal})
                if(usersRef){
                 let userC=  await db.get().collection(collection.USER_COLLECTION).findOne({email:userId})
                 if(userC){
                    db.get().collection(collection.USER_COLLECTION).updateOne({email:userId},
                    {
                        $set:{
                            wallet:100
                        }
                    })
                    db.get().collection(collection.USER_COLLECTION).updateOne({refferalId:refferal},
                        {
                          
                                $inc:{

                                    wallet:100
                                }
                                })
                      db.get().collection(collection.ADMIN_CRED).updateOne({_id:objectId(adminId)},
                      {
                        $inc:{
                            wallet:-200
                        }
                      })          
                    resolve()
                 }else{
                     console.log('not found');
                     resolve()
                 }
                }else{
                    resolve()
                }

            })
        },
        getCouponUser:(userId)=>{
               return new Promise(async(resolve,reject)=>{
              let userC=  await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
              console.log('zzzzzzzzzzz');
             coupon= userC.coupon
              console.log(userC.coupon);
              if(userC){
                await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId),coupon}).then(()=>{
                    console.log('undeeeeeeeeeeeeee');
                    resolve(coupon)
                })
               
              }
            })
        },
        checkWalletAmount:(wallet,offerPro,userId)=>{
            return new Promise(async(resolve,reject)=>{
                if(wallet<offerPro){
                    
                    db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
                    {
                        $set:{
                            minWall:true
                        }
                    })
                    
                    resolve()
                }else{
                    db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
                    {
                        $unset:{
                            minWall:'0'
                        }
                    })
                    
                    resolve()
                }
            })

        },
        redeemWallet:(userId)=>{
            return new Promise(async(resolve,reject)=>{

           await db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(userId)},
           {
            $set:{
                appliedWallet:true,
                wallet:0
            }
           
           })
           resolve()
            
            })
           

        },
        // findAppliedWallet:(userId,availWallet)=>{
        //     let response={}
        //     return new Promise(async(resolve,reject)=>{
        //     let wallet=  await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId),availWallet})
        //     if(wallet){
        //         response.status=true
        //         resolve(response)
        //         console.log('kittyyyyyyy');
        //     }
                
             
        //     })
        // }
        


        

   
}