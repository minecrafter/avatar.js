// Gravatar-compatible server. Requires express.

var	fs = require("fs"),
	path = require("path"),
	express = require("express"),
	parsers = require("body-parser");
	gm = require("gm"),
	crypto = require("crypto"),
	redis = require("redis");

// regularize email
function hashableEmail(e) {
	return e.trim().toLowerCase();
}

// paths
var defaultimg = "./res/default.jpg";
var avatarpath = "./avatars/";

// init

var dbclient = redis.createClient();

dbclient.on('error', function (err) {
  console.log('Error ' + err);
});

var server  = express();
server.use(express.static("res"));

server.get("/avatar/:hash", function(req, res) {
		// aliasing var
		var id = req.params.hash;
		var p = path.join(avatarpath, id);
		// check if even a valid hash (no dir traverse)
		if (!/^[a-f0-9]+$/.test(id)) {
			res.sendStatus(400).end(); return;
		}
		// the size is needed and gravatar uses 80 default
		var size = req.query.s ? req.query.s : 80;
		// if force default OR non-existant, just use default
		if (req.query.f == "y" || !fs.existsSync(p)) {
			gm(defaultimg).resize(size,size).noProfile().toBuffer(
	                        function (err, buffer) {
                                	if (err) {
                        	                console.log("couldn't resize " + id + " to " + size);
                	                        res.sendStatus(500).end(); return;
        	                        }
	                                res.set("Content-Type", "image/jpg");
                                	res.send(buffer).end();
                        	}
                	);
			return;
		}
		// i guess it's fine
		gm(p).resize(size,size).noProfile().toBuffer(
			function (err, buffer) {
				if (err) {
					console.log("couldn't resize " + id + " to " + size);
					res.sendStatus(500).end(); return;
				}
				res.set("Content-Type", "image/jpg");
				res.send(buffer).end();
			}
		);
	}
);

// client API

var ueparser = parsers.urlencoded({extended: false});

server.post('/api/register', ueparser, function(req, res) {
		// check if the username exists
		if (!req.body || dbclient.exists(hashableEmail(req.body.email))) {
			res.sendStatus(400).end(); return;
		}
		var shasum = crypto.createHash("sha512");
		shasum.update(req.body.password);
		dbclient.set(hashableEmail(req.body.email), shasum.digest("hex"), redis.print);
	}
);

server.post("/api/delete", ueparser, function(req, res) {
		if (!req.body || !dbclient.exists(hashableEmail(req.body.email))) {
			res.sendStatus(400).end(); return;
		}
		// hash and compare PWs from request and db
		var shasum = crypto.createHash("sha512");
		shasum.update(req.body.password);
		var dbpw = dbclient.get(hashableEmail(req.body.email), redis.print);
		if (shasum.digest("hex") === dbpw) {
			var md5sum = crypto.createHash("md5");
			md5sum.update(hashableEmail(req.body.email)
			var id = md5sum.digest("hex");
			var p = path.join(avatarpath, id);
			if (fs.existsSync(p) {
				fs.unlinkSync(p);
			}
		} else {
			res.sendStatus(400).end(); return;
		}
	}
);

server.listen(3000);
