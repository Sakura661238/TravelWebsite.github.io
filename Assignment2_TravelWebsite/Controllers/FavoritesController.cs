using Assignment2_TravelWebsite.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using Assignment2_TravelWebsite.Models;

namespace Assignment2_TravelWebsite.Controllers
{
    public class FavoritesController : Controller
    {
        // Favorites page: corresponds to Views/Favorites/Index.cshtml
        public ActionResult Index(string sortBy = "date")
        {
            // 1. Get favorite attraction ID list from Session (initialize empty list if none)
            var favoriteIds = Session["FavoriteDestIds"] as List<int> ?? new List<int>();
            var context = new DestinationContext();
            var allDests = context.GetAllDestinations();

            // 2. Filter favorite attractions
            var favoriteDests = allDests.Where(d => favoriteIds.Contains(d.Id)).ToList();

            // 3. Sort favorites 
            var sortedFavorites = SortFavorites(favoriteDests, sortBy);

            // 4. Pass data to view
            ViewBag.FavoriteDests = sortedFavorites;
            ViewBag.SortBy = sortBy; // Current sort method (for echo)

            return View();
        }

        // Add to favorites (AJAX call)
        public JsonResult AddToFavorite(int destId)
        {
            var favoriteIds = Session["FavoriteDestIds"] as List<int> ?? new List<int>();
            if (!favoriteIds.Contains(destId))
            {
                favoriteIds.Add(destId);
                Session["FavoriteDestIds"] = favoriteIds;
                // Store favorite time (for sorting)
                Session[$"FavoriteTime_{destId}"] = DateTime.Now;
                return Json(new { success = true, msg = "Added to favorites" }, JsonRequestBehavior.AllowGet);
            }
            return Json(new { success = false, msg = "Already in favorites" }, JsonRequestBehavior.AllowGet);
        }

        // Remove from favorites (AJAX call)
        public JsonResult RemoveFromFavorite(int destId)
        {
            var favoriteIds = Session["FavoriteDestIds"] as List<int> ?? new List<int>();
            if (favoriteIds.Contains(destId))
            {
                favoriteIds.Remove(destId);
                Session["FavoriteDestIds"] = favoriteIds;
                Session.Remove($"FavoriteTime_{destId}"); // Delete favorite time
                return Json(new { success = true, msg = "Removed from favorites" }, JsonRequestBehavior.AllowGet);
            }
            return Json(new { success = false, msg = "Not in favorites" }, JsonRequestBehavior.AllowGet);
        }

        // Sorting logic (private method, for internal use)
        private List<Destination> SortFavorites(List<Destination> dests, string sortBy)
        {
            switch (sortBy)
            {
                case "rating": // By rating descending
                    return dests.OrderByDescending(d => d.Rating).ToList();
                case "name":   // By name ascending (Chinese sorting)
                    return dests.OrderBy(d => d.Name).ToList();
                case "date":   // By favorite time descending (default)
                default:
                    return dests.OrderByDescending(d =>
                        Session[$"FavoriteTime_{d.Id}"] as DateTime? ?? DateTime.MinValue
                    ).ToList();
            }
        }
        // Clear all favorites
        public ActionResult ClearAll()
        {
            Session["FavoriteDestIds"] = new List<int>();
            // Clear all favorite times
            var keysToRemove = Session.Keys.Cast<string>()
                .Where(key => key.StartsWith("FavoriteTime_"))
                .ToList();
            foreach (var key in keysToRemove)
            {
                Session.Remove(key);
            }
            return RedirectToAction("Index");
        }
    }
}