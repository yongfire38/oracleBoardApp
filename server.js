var http = require("http"); //기본 웹 서버 모듈
var express = require("express"); //웹 서버의 기능을 보완한 모듈, 외부 모듈
var oracledb = require("oracledb");  //오라클 모듈, 외부 모듈

var bodyParser = require("body-parser");//파라미터값들을 json 형태 변환하여 받아줌..

var app = express();//express 객체 생성
var server = http.createServer(app);//서버 생성

//지금까지는 내부,외부 모듈만 사용해 왓으나, 개발자가 정의한
//모듈도 사용해보자!!
var dbstring = require("./dbstring.js");


/* html, image, css, 동영상 파일등이 정적자원 까지도
일일이 app.get() 으로 처리하게 되면, 서버에 너무 많은
메서드가 코딩되어져야 한다...비현실적...
해결책? 정적자원의 위치를 지정하면된다..바로 이 기능은 
         express 모듈에서 지원한다...
 */

//express 모듈은 각종 미들웨어라 불리는 기능을 지원하는데
//미들웨어를 사용시 use() 라는 메서드를 이용할 수 있다..
//현재 실행중인 js파일의 하드디스크 물리적 경로 반환 
//__dirname 전역변수
app.use(express.static(__dirname + "/"));

//스프링과 마찬가지로 nodejs 에서도 정해진 뷰템플릿을 지원한다
//jade, ejs 
app.set("view engine", "ejs");//확장자를 명시할 필요없음..
app.set("views", __dirname + "/views");//대신에 ejs 는 무조건
//views 라는 디렉토리에 놓아야 한다...

//extended 의미 파라미터의 json 객체 안에 또 json을 포함할수있는지
app.use(bodyParser.urlencoded({ "extended": false }));
app.use(bodyParser.json());


//시작하면 전체 데이터 읽어 오기
function readAllData() {
    oracledb.getConnection(dbstring, function (error, connection) {
        if (error) {
            console.log(error);
        } else {
            console.log(connection);
            var sql = "SELECT NOTICE_ID, TITLE, WRITER, CONTENT, HIT, TO_CHAR(REGDATE,'YYYYmmdd') FROM NOTICE ORDER BY NOTICE_ID DESC";
            connection.execute(sql, function (err, result) {
                if (err) {
                    console.log(err);
                    doRelease(connection);
                } else {
                    console.log(result);
                    doRelease(connection);
                }
            });
        }
    })
};


//연결 끊기 메서드
function doRelease(connection) {
    connection.release(
        function (err) {
            if (err) {
                console.error(err.message);
            }
        });
}

//목록 보기 요청
app.get("/board/list", function (request, response) {
    //select 쿼리로 조회
    readAllData();
});




//글 쓰기 요청
app.post("/board/write", function (request, response) {
    //파라미터 값들이 제대로 전송되어 오는지 확인...
    //express 모듈을 사용하면 body 속성을 이용하여 post 방식으로 전송된 파라미터 값들을 받아 올 수 있다.

    console.log(request.body);

    oracledb.getConnection(dbstring, function (error, connection) {
        if (error) {
            console.log(error);
        } else {

            var title = request.body.title;
            var writer = request.body.writer;
            var content = request.body.content;

            var sql = "insert into notice(notice_id,title,writer,content) values(NOTICESEQ.nextval,:0,:1,:2)";

            connection.execute(sql, [title, writer, content], { autoCommit: true }, function (err, result) {
                if (err) {
                    console.log(err);
                    doRelease(connection);
                } else {
                    console.log(result);
                    if (result.rowsAffected == 0) {
                        console.log("등록실패");
                    } else {
                        console.log("등록성공");

                        //목록을 보여주기!!!   
                        //클라이언트의 브라우저로 하여금
                        //지정한 url 로 다시 접속하라...
                        response.redirect("/board/list");
                    }
                    doRelease(connection);
                }
            });
        }
    });

});


server.listen(8888, function () {
    console.log("웹서버가 8888포트에서 가동중..");
});