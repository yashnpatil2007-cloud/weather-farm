import sqlite3

c = sqlite3.connect("farming.db")
print(c.execute(
    "select substr(observed_at,1,7), count(*) from weather_records "
    "where user_id=2 group by 1 order by 1"
).fetchall())
