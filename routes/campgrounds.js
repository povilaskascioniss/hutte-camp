var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var middleware = require("../middleware");
const fs = require("fs");
var multer = require("multer");
var storage = multer.diskStorage({
  destination: "./public/uploads",
  filename: function (req, file, cb) {
    cb(null, Date.now() + ".jpg");
  }
});
var upload = multer({ storage: storage });

router.get("/", function(req, res){
    Campground.find({}, function(err, campgrounds){
        if(err){
            console.log(err);
        } else {
            res.render("campgrounds/index", {campgrounds:campgrounds});
        }
    });
});
//ADD NEW CAMPGROUD
router.post("/", middleware.isLoggedIn, upload.single("imageup"), function(req, res){
    if(req.file){
         var uploadPath = "/uploads/" + req.file.filename;
    }
    var name = req.body.name;
    var price = req.body.price;
    var image = req.body.image;
    var description = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    var newCampground = {name: name, uploadPath: uploadPath,  price: price, image: image, description: description, author: author};
    Campground.create(newCampground, function(err, newlyCreated){
        if(err){
            console.log(err);
        } else{
            req.flash("success", "Successfully added your hutte");
            res.redirect("/campgrounds");
        }
    });
});

//NEW FORM
router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("campgrounds/new");
});
//SHOW ROUTE
router.get("/:id", function(req, res){
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err){
            console.log(err);
        } else {
            res.render("campgrounds/show", {campground:foundCampground});
        }
    });
});

//EDIT FORM ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res){
        Campground.findById(req.params.id, function(err, foundCampground){
            res.render("campgrounds/edit", {campground: foundCampground}); 
        });
});

//UPDATE ROUTE
router.post("/:id", middleware.checkCampgroundOwnership, upload.single("upImage"), function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if (err){
            console.log(err);
        } else {
            if(foundCampground.uploadPath){
                var path = "./public" + foundCampground.uploadPath;
                fs.unlink(path, function(err){
                    if(err){
                        console.log(err);
                    } else {
                        console.log("Yay deleted " + foundCampground.uploadPath);
                    }
                });
            }
        }
    });
    
    if(req.file){
        req.body.campground.uploadPath = "/uploads/" + req.file.filename;
    }
    
    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
        if(err){
            res.redirect("/campgrounds");
        } else {
            req.flash("success", "Your hutte has been updated!");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//DESTROY ROUTe
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res){
    Campground.findById(req.params.id, function(err, foundCampground){
        if (err){
            console.log(err);
        } else {
            if(foundCampground.uploadPath){
                var path = "./public" + foundCampground.uploadPath;
                fs.unlink(path, function(err){
                    if(err){
                        console.log(err);
                    } else {
                        console.log("Yay deleted " + foundCampground.uploadPath);
                    }
                });
            }
        }
    });
    
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/campgrounds");
        } else {
            
            req.flash("info", "Your hutte has been deleted");
            res.redirect("/campgrounds");
        }
    });
    
});


module.exports = router;