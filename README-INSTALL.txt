CARAVAN TRIP PLANNER — NEXT TRIP + RETURN MILEAGE + BOOKINGS

This is an update to the existing website, not a new site.
No D1 schema migration is required if the previous image/mileage/activities update is working.

1. In GitHub main branch replace:
   public/app.js
   public/index.html
   public/style.css
   (Do not upload these into the repository root.)
2. Commit changes and wait for Cloudflare Pages production deployment.
   Build output directory should be 'public'.
3. Back up your current live trip data using Export backup.
4. Optionally use Import changes to import:
   caravan-planner-import-with-booking-details.json
   This import preserves trip IDs, and adds:
   Min-y-don reference B-2VZPETT, due 26 February 2027.
   Cornwall references for Polmanter and Monkey Tree, with earliest due date
   25 June 2027 in the due-date field; Polmanter due 4 July 2027 in notes.
   It also carries forward photos, mileage and activity suggestions from
   the earlier enriched import. Confirm any local edits made since that file.
   Import updates ALL 10 trip records, so recent edits to any trip may be overwritten.

DISPLAY:
- Round-trip mileage = 2 x manually entered one-way mileage.
  This is an approximation and excludes multi-stop travel and local excursions.
- Booking details display when booking reference and/or due date exists.
- The Next Trip banner shows the nearest non-cancelled trip that has not ended,
  with a days/hours/minutes countdown to local midnight on the arrival date.
  During the trip it displays 'On your trip!'. Countdown updates every minute.
- No booking reference was available for Hartington Hills, so it is left blank.
- Cornwall is one combined trip with two site booking references. The main
  due date shows the earliest; both dates are recorded in notes.
