CREATE TABLE "public.user" (
	"id" serial(255) NOT NULL,
	"first_name" serial(255) NOT NULL,
	"last_name" serial(255) NOT NULL,
	"username" serial(255) NOT NULL,
	"fav_movies" varchar(255) NOT NULL,
	"fav_shows" varchar(255) NOT NULL,
	CONSTRAINT "user_pk" PRIMARY KEY ("id")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "public.movies" (
	"id" serial NOT NULL,
	"user_id" serial NOT NULL,
	"movie_title" varchar(255) NOT NULL,
	CONSTRAINT "movies_pk" PRIMARY KEY ("id")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "public.tv_shows" (
	"id" serial NOT NULL,
	"show_name" serial(255) NOT NULL,
	CONSTRAINT "tv_shows_pk" PRIMARY KEY ("id","show_name")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "public.movie_chars" (
	"id" serial NOT NULL,
	"char_name" varchar(255) NOT NULL,
	"movie_name" varchar(255) NOT NULL,
	CONSTRAINT "movie_chars_pk" PRIMARY KEY ("id")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "public.fav_movies" (
	"id" serial NOT NULL,
	"movie_title" varchar(255) NOT NULL,
	CONSTRAINT "fav_movies_pk" PRIMARY KEY ("id")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "public.fav_shows" (
	"id" serial(255) NOT NULL,
	"show_title" varchar(255) NOT NULL,
	CONSTRAINT "fav_shows_pk" PRIMARY KEY ("id")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "public.show_chars" (
	"id" serial NOT NULL,
	"char_name" varchar(255) NOT NULL,
	"show_name" varchar(255) NOT NULL,
	CONSTRAINT "show_chars_pk" PRIMARY KEY ("id")
) WITH (
  OIDS=FALSE
);



CREATE TABLE "public.fav_characters" (
	"id" serial NOT NULL,
	"char_name" varchar(255) NOT NULL,
	"is_movie" BOOLEAN(255) NOT NULL,
	"is_show" BOOLEAN(255) NOT NULL,
	"user_id" BOOLEAN(255) NOT NULL,
	CONSTRAINT "fav_characters_pk" PRIMARY KEY ("id")
) WITH (
  OIDS=FALSE
);



ALTER TABLE "user" ADD CONSTRAINT "user_fk0" FOREIGN KEY ("fav_movies") REFERENCES "fav_movies"("id");
ALTER TABLE "user" ADD CONSTRAINT "user_fk1" FOREIGN KEY ("fav_shows") REFERENCES "fav_shows"("id");

ALTER TABLE "movies" ADD CONSTRAINT "movies_fk0" FOREIGN KEY ("user_id") REFERENCES ""("");


ALTER TABLE "movie_chars" ADD CONSTRAINT "movie_chars_fk0" FOREIGN KEY ("char_name") REFERENCES "fav_characters"("char_name");
ALTER TABLE "movie_chars" ADD CONSTRAINT "movie_chars_fk1" FOREIGN KEY ("movie_name") REFERENCES "movies"("movie_title");

ALTER TABLE "fav_movies" ADD CONSTRAINT "fav_movies_fk0" FOREIGN KEY ("movie_title") REFERENCES "movies"("id");

ALTER TABLE "fav_shows" ADD CONSTRAINT "fav_shows_fk0" FOREIGN KEY ("show_title") REFERENCES "tv_shows"("id");

ALTER TABLE "show_chars" ADD CONSTRAINT "show_chars_fk0" FOREIGN KEY ("char_name") REFERENCES "fav_characters"("char_name");
ALTER TABLE "show_chars" ADD CONSTRAINT "show_chars_fk1" FOREIGN KEY ("show_name") REFERENCES "tv_shows"("show_name");

ALTER TABLE "fav_characters" ADD CONSTRAINT "fav_characters_fk0" FOREIGN KEY ("user_id") REFERENCES "user"("id");









