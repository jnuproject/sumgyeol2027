# Satellite reference pass · r32

The active scene uses 65 buildings, 94 roads/paths and 41 areas (13 parking polygons). The original data file remains 59/91/35. Browser verification metadata reports `campus-satellite-r32` and includes the tracing calibration and restored sports generator.

Corrected the pre-existing tests that still asserted the superseded 17.5m-to-7.4m two-lane road, four arrows, and original 58/75/27 source counts. The current prior implementation already uses an 18m four-lane road, eight arrows and expanded 59/91/35 source counts; assertions for source preservation, safe starts and finite geometry remain.

The visual check covers the north-up overview, restored stadium, distinct empty lawns, northern garden polygons, added annexes, parking, and aerial crown visibility. Ground-level walking and source terrain tests are run separately. Exact elevation and photograph-perfect reproduction are not verified.

Final checks: all 43 terrain, collision, entry, walking-area, scene, peripheral and satellite-layout tests passed. After the last road-alignment adjustment, all four satellite-specific tests passed again. Browser WebGL2 check reported 65 rendered buildings, 94 roads, 41 areas, 13 parking polygons and the restored stadium. Held forward movement travelled 10.27m while remaining inside the walking area. Both ground-level and aerial screenshots are saved alongside this record.
