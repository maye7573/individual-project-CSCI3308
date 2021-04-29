/***********************
  Load Components!

  Express      - A Node.js Framework
  Body-Parser  - A tool to help use parse the data in a post request
  Pg-Promise   - A database tool to help use connect to our PostgreSQL database
***********************/
var express = require('express'); //Ensure our express framework has been added
var app = express();
var bodyParser = require('body-parser'); //Ensure our body-parser tool has been added
app.use(bodyParser.json());              // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
//Create Database Connection
var pgp = require('pg-promise')();

/**********************
  Database Connection information
  host: This defines the ip address of the server hosting our database.
		We'll be using `db` as this is the name of the postgres container in our
		docker-compose.yml file. Docker will translate this into the actual ip of the
		container for us (i.e. can't be access via the Internet).
  port: This defines what port we can expect to communicate to our database.  We'll use 5432 to talk with PostgreSQL
  database: This is the name of our specific database.  From our previous lab,
		we created the football_db database, which holds our football data tables
  user: This should be left as postgres, the default user account created when PostgreSQL was installed
  password: This the password for accessing the database. We set this in the
		docker-compose.yml for now, usually that'd be in a seperate file so you're not pushing your credentials to GitHub :).
**********************/
const dbConfig = {
	host: 'localhost',
	port: 5432,
	database: process.env.POSTGRES_DB,
	user: process.env.POSTGRES_USER,
	password: process.env.POSTGRES_PASSWORD
};
const isProduction = process.env.NODE_ENV === 'production';
const dbConfig = isProduction ? process.env.DATABASE_URL : dev_dbConfig;

// fixes: https://github.com/vitaly-t/pg-promise/issues/711
if (isProduction) {
	pgp.pg.defaults.ssl = {rejectUnauthorized: false};
}

let db = pgp(dbConfig);
const axios = require('axios');
//const qs = require('query-string');
// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/'));//This line is necessary for us to use relative paths and access our resources directory


 //review page
app.get('/review', function(req, res) {
	var query = 'select * from finalproject.project;';
	db.any(query)
	.then(function (rows) {
		res.render('pages/review',{
			my_title: "Review Page",
			data: rows,
			color: '',
			color_msg: ''
		})

	})
	.catch(function (err) {
		console.log('error', err);
		res.render('pages/review', {
			my_title: 'Home Page',
			data: '',
			color: '',
			color_msg: ''
		})
	})
});

/*Add your other get/post request handlers below here: */

//home
app.get('/', function(req, res) {
	res.render('pages/main', {
	  my_title: "home",
	});
  });

  app.get('/home', function(req, res) {
	res.render('pages/main', {
	  my_title: "home",
	});
  });



 app.post('/get_feed', function(req, res) {
	var artist_name = req.body.title; 
	
	if(req.body) {
	  axios({
		url: `https://theaudiodb.com/api/v1/json/1/search.php?s=${artist_name}`,
		  method: 'GET',
		  dataType:'json',
		})
		  .then(items => {
			// TODO: Return the reviews to the front-end (e.g., res.render(...);); Try printing 'items' to the console to see what the GET request to the Twitter API returned.
			// Did console.log(items) return anything useful? How about console.log(items.data.results)?
			// Stuck? Look at the '/' route above
			//console.log(items);

			for(var i=0; i < items.data.artists.length; i++) {
				console.log(items.data.artists[i]);

				console.log("Name:"+items.data.artists[i].strArtist);
				console.log("Formation Year:"+items.data.artists[i].intFormedYear);
				console.log("Bio:"+items.data.artists[i].strBiographyEN);
				console.log("Generes:"+items.data.artists[i].strGenre);
				console.log("Website:"+items.data.artists[i].strWebsite);
				console.log("Banner:"+items.data.artists[i].strArtistBanner);	
		}
			
			res.render('pages/home', {
			  my_title: "Artist Description",
			  items: items.data.artists,
			  error: false,
			  message: ''
			});
  
		  })
		  .catch(error => {
			if (error.response) {
			  console.log(error.response.data);
			  console.log(error.response.status);
			}
			console.log(error);
			res.render('pages/home',{
			  my_title: "Artist Description",
			  items: '',
			  error: true,
			  message: error
			})
		  });
	}
  
  
	else {
	  // TODO: Render the home page and include an error message (e.g., res.render(...);); Why was there an error? When does this code get executed? Look at the if statement above
	  // Stuck? On the web page, try submitting a search query without a search term
	}
  });
  
  app.post('/review', function(req, res) {
	console.log("Before postgres call");
	var review_message = req.body.review_message;
	//var review_date = new Date(new Date().getFullYear(),new Date().getMonth() , new Date().getDate());
	var artist_name = req.body.artistName;
	console.log("Artist passed to postgres is " + artist_name);
	var insert_statement = "INSERT INTO finalproject.project(tv_show, review) VALUES('" + artist_name + "','" +
		review_message + "') ON CONFLICT DO NOTHING;";
	var review_select = 'select * from finalproject.project;';
	console.log(insert_statement);
	db.task('get-everything', task => {
				return task.batch([
					task.any(insert_statement),
					task.any(review_select)
				]);
			})
		.then(info => {
			console.log(info[1]);
			res.render('pages/review',{
				my_title: "Review Page",
				data: info[1],

			})
		})
		
		.catch(error => {

			console.log(error);
			response.render('pages/review', {
				title: 'Review Page',
				data: '',
				color: '',
				color_msg: ''
			})
		});
		
});

app.post('/filter', function(req, res) {
	var artist_name = req.body.artist_name;
	//console.log("artist name from request: " + req.body.artist_name);
	var query = "SELECT tv_show, review, review_date FROM finalproject.project WHERE tv_show = '"+artist_name+"';";
	var query1 = 'select * from finalproject.project;';
	db.task('get-everything', task => {
		return task.batch([
			task.any(query),
			task.any(query1)
		]);
	})

	.then(function (rows) {
		if(rows[0].length > 0){
			//console.log("1 or more rows returned");
			res.render('pages/review',{
				my_title: "Review Page",
				data: rows[0],
				color: '',
				color_msg: ''
			})
	
		}
		else{
			//console.log("you are in else");
			res.render('pages/review',{
				my_title: "Review Page",
				data: rows[1],
				color: '',
				color_msg: ''
			})

		}

	})
	.catch(function (err) {
		console.log('error', err);
		res.render('pages/review', {
			my_title: 'reviews',
			data: '',
			color: '',
			color_msg: ''
		})
	})
});


app.get("/", (req, res) => {
	res.json({ status: "success", message: "Welcome!" });
  });
  

  



//app.listen(3000);
//console.log('3000 is the magic port');
const server = app.listen(process.env.PORT || 3000, () => {
	console.log(`Express running → PORT ${server.address().port}`);
  });