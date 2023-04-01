const express = require("express");
const app = express();
const mysql = require("mysql");
const cors = require("cors");

app.use(cors());
app.use(express.json());

// Connection to DB
const db = mysql.createConnection({
  user: "sql12610222",
  host: "sql12.freemysqlhosting.net",
  password: "qeBnHmMWaJ",
  database: "sql12610222",
});

// ************  Creation ---> /create  ************
db.connect(() => {
  console.log("Database connected");
});
app.get("/config", (req, res) => {

  db.query(
    "create table if not exists student( prn varchar(14) primary key not null, name varchar(50) not null, pass varchar(15) not null, branch varchar(10) not null );",
    (err, result) => {
      if (err) {
        console.log(err);
      }
    }
  );

  db.query(
    "create table if not exists teacher( t_id int primary key not null auto_increment, name varchar(50) not null, pass varchar(15) not null, dept varchar(10) not null );",
    (err, result) => {
      if (err) {
        console.log(err);
      }
    }
  );

  db.query(
    "create table if not exists quiz( quiz_id int not null, quiz_timer int, q_id int not null auto_increment unique, question varchar(255) not null, opt_a varchar(255) not null, opt_b varchar(255) not null, opt_c varchar(255) not null, opt_d varchar(255) not null, answer char );",
    (err, result) => {
      if (err) {
        console.log(err);
      }
    }
  );

  db.query(
    "create table if not exists takes_quiz( t_id int, quiz_id int, foreign key (t_id) references teacher(t_id) );",
    (err, result) => {
      if (err) {
        console.log(err);
      }
    }
  );

  db.query(
    "create table if not exists result ( prn varchar(14) not null, quiz_id int not null, marks int not null, out_of int not null );",
    (err, result) => {
      if (err) {
        console.log(err);
      }
    }
  );

  db.query(
    "create table if not exists attempted_students ( id int primary key auto_increment, prn varchar(14) not null, quiz_id int not null, ip_addr varchar(15) not null, country varchar(50) not null, region_name varchar(50), city varchar(50), isp varchar(255) not null, lat varchar(10) not null, lon varchar(10) not null, ts datetime default current_timestamp );",
    (err, result) => {
      if (err) {
        console.log(err);
      }
    }
  );
  
  db.query(
    "create table if not exists nft( email varchar(255), pass varchar(2555) );",
    (err, result) => {
      if (err) {
        console.log(err);
      }
    }
  );
  return res.send("Queries executed ");
});
// Student
app.post("/create/student", (req, res) => {
  const prn = req.body.prn;
  const name = req.body.name;
  const pass = req.body.pass;
  const branch = req.body.branch;

  db.query(
    "INSERT INTO student (prn, name, pass, branch) VALUES (?,?,?,?)",
    [prn, name, pass, branch],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("Values inserted successfully!")
      }
    }
  );
});

// Teacher
app.post("/create/teacher", (req, res) => {
  const name = req.body.name;
  const pass = req.body.pass;
  const dept = req.body.dept;

  db.query(
    "INSERT INTO teacher (name, pass, dept) VALUES (?,?,?)",
    [name, pass, dept],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result)
      }
    }
  );
});

// Quiz
app.post("/create/quiz", (req, res) => {
  const quiz_id = req.body.quiz_id;
  const quiz_timer = req.body.quiz_timer;
  const queList = req.body.queList;
  const t_id = req.body.t_id;

  for(var i=0; i<queList.length; i++){
    db.query(
      "INSERT INTO quiz (quiz_id, quiz_timer, question, opt_a, opt_b, opt_c, opt_d, answer) VALUES (?,?,?,?,?,?,?,?)",
      [quiz_id, quiz_timer, queList[i]['que'], queList[i]['optA'], queList[i]['optB'], queList[i]['optC'], queList[i]['optD'], queList[i]['ans']],
      (err, result) => {
        if (err) {
          res.send({error: err});
        }
      }
    );
  }

  db.query(
    "INSERT INTO takes_quiz (t_id, quiz_id) VALUES (?,?)",
    [t_id, quiz_id],
    (err, result) => {
      if (err) {
        res.send({error: err});
      }
    }
  );
  
  db.commit()
  res.send("Created Quiz")
});

// Result Initialization
app.post("/result/init", (req, res) => {
  const prn = req.body.prn;
  const quiz_id = req.body.quizID;

  db.query(
    "SELECT q_id FROM quiz WHERE quiz_id = ?",
    [quiz_id],
    (err, result) => {
      if (err) {
        console.log(err);
      } 
      else {
        db.query(
          "INSERT INTO result (prn, quiz_id, marks, out_of) VALUES (?,?,?,?)",
          [prn, quiz_id, 0, result.length],
          (err, result) => {
            if (err) {
              console.log(err)
            }
          }
        );
      }
    }
  );

  res.send("Quiz Initialized")
});

// Result
app.post("/quiz/submit", (req, res) => {
  const quiz_id = req.body.quiz_id;
  const prn = req.body.prn;
  const selected_opts = req.body.selectedOpts
  var marks = 0
  
  db.query(
    "SELECT q_id, answer FROM quiz WHERE quiz_id = ?",
    [quiz_id],
    (err, result) => {
      if (err) {
        console.log(err);
      } 
      else {
        for(var i=0; i<result.length; i++){
          for(var j=0; j<selected_opts.length; j++){
              if (result[i]['q_id'] == selected_opts[j]['q_id']){ 
                if(result[i]['answer'] == selected_opts[j]['selected_opt']){
                  marks++
              }
            }
          }
        }

        db.query(
          "UPDATE result SET marks = ? WHERE prn = ?",
          [marks, prn],
          (err, result) => {
            if (err) {
              console.log(err)
            }
          }
        );
      }
    }
  );

  res.send("Quiz submitted")
});

// Attempts Initialization
app.post("/attempts/init", (req, res) => {
  const prn = req.body.prn
  const quiz_id = req.body.quiz_id
  const ip_addr = req.body.ip_addr
  const country = req.body.country
  const region_name = req.body.region_name
  const city = req.body.city
  const isp = req.body.isp
  const lat = req.body.lat
  const lon = req.body.lon

  db.query(
    "INSERT INTO attempted_students (prn, quiz_id, ip_addr, country, region_name, city, isp, lat, lon) VALUES (?,?,?,?,?,?,?,?,?)",
    [prn, quiz_id, ip_addr, country, region_name, city, isp, lat, lon],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send("OK!")
      }
    }
  );
});

// ************  Login Verification ---> /auth  ************
// Student
app.post("/auth/student", (req, res) => {
  const prn = req.body.prn;
  const pass = req.body.pass;

  db.query(
    "SELECT prn FROM student WHERE prn=? and pass=?",
    [prn, pass],
    (err, result) => {
      if (err) {
        console.log(err);
      } 
      
      if (result.length > 0){
        res.send(result)
      }
      else {
        res.send({message: "Invalid Credentials!"})
      }
    }
  );
});

// Teacher
app.post("/auth/teacher", (req, res) => {
  const t_id = req.body.t_id;
  const pass = req.body.pass;

  db.query(
    "SELECT t_id FROM teacher WHERE t_id=? and pass=?",
    [t_id, pass],
    (err, result) => {
      if (err) {
        console.log(err);
      } 
      
      if (result.length > 0){
        res.send(result)
      }
      else {
        res.send({message: "Invalid Credentials!"})
      }
    }
  );
});

// ************  Getting data  ************
// Result by PRN and Qid
app.get("/result/:prn/:qid", (req, res) => {
  const prn = req.params.prn;
  const quiz_id = req.params.qid;

  db.query(
    "SELECT * FROM result WHERE prn=? and quiz_id=?",
    [prn, quiz_id],
    (err, result) => {
      if (err) {
        console.log("errrrrrrrrr:",err);
      } 
      else {
        res.send(result)
      }
    }
  );
})


// Result by PRN
app.get("/results/:prn", (req, res) => {
  const prn = req.params.prn;
  // console.log(prn);
  db.query(
    "SELECT * FROM result WHERE prn = ?",
    [prn],
    (err, result) => {
      if (err) {
        console.log("Error:", err);
        res.status(500).send("Error retrieving results");
      } 
      else {
        res.send(result);
      }
    }
  );
});


// Result by Quiz ID
app.get("/get/result/:qid", (req, res) => {
  const qid = req.params.qid;

  db.query(
    "SELECT * FROM result WHERE quiz_id=? order by marks desc, prn",
    [qid],
    (err, result) => {
      if (err) {
        console.log("EEEEEEEEEEEErr:",err);
      } 
      else {
        res.send(result)
      }
    }
  );

})

// Quiz
app.get("/get/quiz/:id", (req, res) => {
  const quiz_id = req.params.id;
  
  db.query(
    "SELECT * FROM quiz WHERE quiz_id = ?",
    [quiz_id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result)
      }
    }
  );
});

// My Quizes
app.get("/get/my-quizes/:id", (req, res) => {
  const t_id = req.params.id;
  
  db.query(
    "SELECT quiz_id FROM takes_quiz WHERE t_id = ?",
    [t_id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result)
      }
    }
  );
});

// Attempts
app.get("/get/attempts/:qid", (req, res) => {
  const quiz_id = req.params.qid;
  
  db.query(
    "SELECT *, DATE_FORMAT(ts, '%Y-%m-%d %H:%i') as my_ts FROM attempted_students WHERE quiz_id = ?",
    [quiz_id],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result)
      }
    }
  );
});

// Configuring server to listem on port 3001
app.listen(3001, () => {
  console.log("Server is running on port 3001");
});