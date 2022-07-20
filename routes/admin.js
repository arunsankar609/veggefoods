var express = require('express');
const res = require('express/lib/response');
const { status } = require('express/lib/response');
const async = require('hbs/lib/async');
const { Db } = require('mongodb');
const { response } = require('../app');
//const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper=require('../helpers/product-helpers');
const userHelper = require('../helpers/user-helper');

// adminCred ={
//   email:"admin@gmail.com",
//   password:"12345"
// }

const verifyLogin=(req,res,next)=>{
  
  if(req.session.loggedIn){
    next()
  }else{
res.redirect('/admin/')

}
}
/* GET users listing. */
// router.get('/', function(req, res, next) {
//   res.send('respond with a resource');
// });
// router.get('/login', function(req, res, next) {
  
//   res.render('admin/login');
  
// });
router.get('/', function(req, res, next) {
  
  res.render('admin/login',{admin:true,'failedErr':req.session.failedErr});
  
});
router.post('/login',(req,res)=>{
  userHelper.adminLogin(req.body).then((response)=>{
    console.log('trrtrtrtrrt');
  console.log(response);

    if(response.status){
      req.session.loggedIn=true
      req.session.admin=true
      res.redirect('/admin/panel')
    }else{
      req.session.failedErr='Invalid password or username'
       res.redirect('/admin/')
    }

  })
})
router.get('/logout', function(req, res, next) {
  req.session.destroy()
  res.redirect('/admin/')
});



router.get('/panel',verifyLogin,async function(req, res, next) {
  let adminWall=await productHelper.getAdminData()
  let totalCount= await userHelper.getAdminOrderCount()
  let totalwallet=await userHelper.getTotalwallet()
  let codTotal= await userHelper.getTotalCOD()
  let razorpayTotal=await userHelper.getTotalRazorpay()
  let paypalTotal=await userHelper.getTotalPaypal()
  let totalObatinedAmount=await userHelper.getAlltotalPayedAmount()
  console.log('3333333333333333333333');
  console.log(totalObatinedAmount);
  res.render('admin/html/index',{admin:true,totalCount,codTotal,razorpayTotal,paypalTotal,totalObatinedAmount,adminWall,totalwallet});
  
});

// router.post('/login', function(req, res, next) {
 
//   if(req.body.name==cred.admin&&req.body.Password==cred.Password ){
    
//    //  adminuser=true
//     req.session.admin=true
    
//     res.redirect('admin/html/index')
  
  
//    // req.session.user=response.user 
//  }else{
//    res.redirect('/login')
//  }
// });


router.get('/addproduct',verifyLogin, async function(req, res, next) {
  let category=await productHelper.getCategory()
  console.log(category)
  res.render('admin/html/product-adding',{category,admin:true});
  
});

router.get('/viewproducts',verifyLogin,async function(req, res, next) {
  let offers=await productHelper.viewProductOffers()

  productHelper.getAllproducts().then((products)=>{
    res.render('admin/html/view-product',{products,admin:true,offers});  
   
  }) 
  
  
});
router.get('/users',verifyLogin, function(req, res) {
  userHelper.getAllusers().then((user)=>{
    
    res.render('admin/html/user-tables',{user,admin:true});
  })  
});
router.post('/addproduct',verifyLogin,function(req, res, next) {
  
  
  
  productHelper.addProduct(req.body,(id)=>{
    let image=req.files.Image
    console.log(image)
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.render('admin/html/product-adding',{admin:true})
      }else{
        console.log(err)
      }
    })
   
  })
});
router.get('/html/block/:id', function(req, res, next) {
  userHelper.blockUsers(req.params.id).then((user)=>{
    res.redirect('/admin/users');
  })
  });
  router.get('/html/unblock/:id', function(req, res, next) {
    
    userHelper.unblockUsers(req.params.id).then((user)=>{
      res.redirect('/admin/users');
    })
    });

    router.get('/html/delete-product/:id',(req,res)=>{
      let proId=req.params.id
      console.log(proId)
      productHelper.deleteproduct(proId).then((response)=>{
res.redirect('/admin/viewproducts')
      })

    })

    router.get('/html/edit-product/:id',async(req,res)=>{
      let category=await productHelper.getCategory()
      let product=await productHelper.getProductDetails(req.params.id)
res.render('admin/html/edit-product',{category,product,admin:true})
    })

    router.post('/html/edit-product/:id',(req,res)=>{
productHelper.updateProduct(req.params.id,req.body).then(()=>{
  if(req.files.Image){
    let id=req.params.id
    let image=req.files.Image
    image.mv('./public/product-images/'+id+'.jpg')
  }
  res.redirect('/admin/viewproducts')
})
    })


router.get('/addcategory',verifyLogin,(req,res)=>{
  
  res.render('admin/html/add-category',{admin:true,'catErr':req.session.catErr})
  req.session.catErr=false
})
router.post('/html/add-category',(req,res)=>{
  console.log(req.body);
  productHelper.addCategory(req.body).then((response)=>{
    if(response.status){
      req.session.catErr=`${response.category} is already exist`
      
      res.redirect('/admin/addcategory')
    }else{
      response.status=false
      console.log(response.category);
      req.session.catErr=`${response.category} Added successfully`
      res.redirect('/admin/addcategory')

    }
    
   
    })  


})


router.get('/viewcategory',verifyLogin,(req,res)=>{
 
  productHelper.getCategory().then((category)=>
  
    { 
  res.render('admin/html/view-category',{category});
    })
  
})
router.get('/html/delete-category/:id',(req,res)=>{
  let catId=req.params.id
  productHelper.deletecategory(catId).then((response)=>{
res.redirect('/admin/viewcategory')
  })

})
router.get('/html/edit-category/:id',async(req,res)=>{
  let cat=await productHelper.editGetCategory(req.params.id)
  console.log(cat)
res.render('admin/html/edit-category',{cat})
})

router.post('/html/edit-category/:id',(req,res)=>{
  
  productHelper.updateCategory(req.params.id,req.body).then(()=>{
   
    res.redirect('/admin/viewcategory')
  })
      })

      router.get('/allorders',verifyLogin,async(req,res)=>{
        userHelper.getAllUserOrders().then((orders)=>{
          console.log('xxxxxxxxxxx000000');
          console.log(orders);
          res.render('admin/html/all-userorders',{orders})
        })
       
      })

      router.get('/view-orderedadmin/:id',async(req,res)=>{
        let products=await userHelper.getOrderedProducts(req.params.id)
        console.log('qwqwqqwqw');
        console.log(products);
         res.render('admin/html/view-checkorderedproducts',{products})
      })

      router.get('/html/cancelAorder/:id',(req,res)=> {
       userHelper.cancelOrders(req.params.id).then(()=>{
        res.redirect('/admin/allorders');

       })
       
          });
   
          router.get('/html/change-delivered/:id',(req,res)=>{
            userHelper.changeStatusDelivered(req.params.id).then(()=>{
              res.redirect('/admin/allorders');
            })
          })

          router.get('/html/change-shipped/:id',(req,res)=>{
            userHelper.ChangeStatusShipped(req.params.id).then(()=>{
              res.redirect('/admin/allorders')
            })
          })

          router.get('/salesreport',verifyLogin,async(req,res)=>{
            let orders=await userHelper.getAllUserOrders()
            let amount=await userHelper.getAlltotalPayedAmount()
            console.log('zorderzzzzzzzzz');
            console.log(orders);
            console.log(amount);
              res.render('admin/html/sales-report',{orders,amount})
            })
            
          router.get('/getallordercount',verifyLogin,(req,re)=>{
            userHelper.getAdminOrderCount().then((count)=>{
              
              console.log(count)
            })
          })

          router.get('/getcodamount',(req,res)=>{
            userHelper.getTotalCOD().then((total)=>{
              console.log('coddddddddd');
              console.log(total);
            })
          })

          router.get('/getrazoramount',(req,res)=>{
            userHelper.getTotalRazorpay().then((total)=>{
              console.log('razorrrr');
              console.log(total);
            })
          })

          router.get('/getpayalamount',(req,res)=>{
            userHelper.getTotalPaypal().then((total)=>{
              console.log('razorrrr');
              console.log(total);
            })
          })

          router.get('/getalltotalamount',(req,res)=>{
            userHelper.getAlltotalPayedAmount().then((total)=>{
              console.log('totalAmounttttt');
              console.log(total);
            })
          })

          router.get('/addoffers',verifyLogin,async(req,res)=>{
            await productHelper.viewProductOffers().then((offers)=>{
              console.log('ordersssssss');
              console.log(offers);
           res.render('admin/html/view-product',{offers})

            })
            
            
          })
          router.post('/html/addoffers',(req,res)=>{
           productHelper.addProductOffers(req.body).then(()=>{
              res.redirect('/admin/viewproducts')
            })
            
          })

          // router.get('/html/apply-offer',(req,res)=>{
          //   productHelper.applyProductOffer(req.params.id).then(()=>{
          //     res.redirect('/admin/addoffers')
          //   })
          // })

          router.post('/html/apply-coupon/:id',(req,res)=>{
            productHelper.applyProductOffer(req.params.id,req.body.offerid).then(()=>{
             console.log('zzwzzwzwzzwz');
             console.log(req.params.id);
             console.log(req.body);
             res.redirect('/admin/viewproducts')

            })
          })

          router.get('/html/remove-offer/:id',(req,res)=>{
            productHelper.removeProductOffer(req.params.id).then(()=>{
              console.log(req.params.id);
               res.redirect('/admin/viewproducts')

            })
          })


          router.get('/addcoupons',verifyLogin,async(req,res)=>{
          let coupons=await productHelper.viewCoupon()
            res.render('admin/html/add-coupon',{coupons})
          })


          router.post('/html/addcoupon',(req,res)=>{
            console.log(req.body);
            productHelper.addCoupon(req.body).then(()=>{
              res.redirect('/admin/addcoupons')
            })
          })

          router.get('/addbanners',verifyLogin,async(req,res)=>{
            let ban=await productHelper.getAllbanners()
            res.render('admin/html/add-banners',{ban})
          })


          router.post('/html/addbanners',(req,res)=>{
            productHelper.addBanners(req.body,(id)=>{
              console.log('zzzzzzzzzzzzzzzzzzzzzzzz000000')
              console.log(req.body)
              let image=req.files.bannerimage
              console.log(image)
              image.mv('./public/banner-images/'+id+'.jpg',(err,done)=>{
                if(!err){
                  res.redirect('/admin/addbanners')
                }else{
                  console.log(err)
                }
              })
             
            })

          })

          router.get('/html/delete-banner/:id',(req,res)=>{
            productHelper.removeBanner(req.params.id).then(()=>{
              res.redirect('/admin/addbanners')
            })
          })

          router.post('/html/edit-banner/:id',(req,res)=>{
            productHelper.updateBanner(req.params.id,req.body).then(()=>{
              console.log('paramsssssssssss');
              console.log(req.params.id);
              console.log(req.body);
              if(req.files.Upimage){
                let id=req.params.id
                let image=req.files.Upimage
                image.mv('./public/banner-images/'+id+'.jpg')
              }
              res.redirect('/admin/addbanners')
            })
                })

             router.get('/referals',verifyLogin,async(req,res)=>{
               let refUser= await userHelper.getAllusers()
               res.render('admin/html/view-referals',{refUser})
             })


             router.post('/addcatoffers',(req,res)=>{
                productHelper.addCatOffer(req.body).then((response)=>{
                 
                 res.json(response)

               })
              //  res.redirect('/admin/viewcategory')
             })

             router.get('/seasonal',verifyLogin,async(req,res)=>{
               let seasonOff=await productHelper.getSeasonalOffer()
               
               res.render('admin/html/seasonal-offer',{seasonOff})
             })

             router.post('/seasonal',(req,res)=>{
               productHelper.applySeasonalOffer(req.body).then(()=>{

                res.redirect('/admin/seasonal')
               })
               
             })

             router.get('/apply-season/:id',async(req,res)=>{
             await  productHelper.applySeason(req.params.id).then(()=>{
                 console.log(req.params.id);
                res.redirect('/admin/seasonal')
               })
              
             })

             router.get('/order-report',async(req,res)=>{
               let daily=await productHelper.getDailySales()
               let monthly=await productHelper.getMonthlySales()
               let year=await productHelper.getYearlySales()
               res.render('admin/html/order-report',{daily,monthly,year})
             })


             router.post('/add-adminmoney',async(req,res)=>{
             
              let admin=await productHelper.getAdminData()
             
              productHelper.addMoneyAdmin(admin._id,req.body.amount).then(()=>{
                res.redirect('/admin/panel')
              })
             })

             router.get('/signup',(req,res)=>{
              res.render('admin/html/admin-signup')
             })

             router.post('/signup',(req,res)=>{
              userHelper.adminSignup(req.body).then(()=>{
                res.redirect('/admin/')
              })
             })

             


module.exports = router;
