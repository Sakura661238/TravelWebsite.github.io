using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;
using Assignment2_TravelWebsite.Models;

namespace Assignment2_TravelWebsite.Controllers
{
    public class DestinationController : Controller
    {
        // Index page (data rendering handled by frontend)
        public ActionResult Index(string region = "", string[] types = null, string search = "", int page = 1, string sort = "desc")
        {
            ViewBag.Title = "Attraction List - Travel Attractions Website";
            return View();
        }

        // New: Return all data as JSON (frontend retrieves via /Destination/AllData)
        [HttpGet]
        public JsonResult AllData()
        {
            var context = new DestinationContext();
            var allDests = context.GetAllDestinations();
            var allRegions = context.GetAllRegions();
            // Return structure: { destinations: [...], regions: [...] }
            return Json(new { destinations = allDests, regions = allRegions }, JsonRequestBehavior.AllowGet);
        }

        // Detail page
        public ActionResult Detail(int? id)
        {
            if (!id.HasValue)
            {
                return RedirectToAction("Index");
            }
            var context = new DestinationContext();
            var dest = context.GetDestinationById(id.Value);
            if (dest == null)
            {
                ViewBag.ErrorMsg = "No information found for this attraction. Please return to the list page and select again";
                return View("Error");
            }
            return View(dest);
        }

        // Optional: Keep Search method
        public JsonResult Search(string searchKey)
        {
            var context = new DestinationContext();
            var allDests = context.GetAllDestinations();
            var matchedDests = allDests.Where(d =>
                d.Name.IndexOf(searchKey, StringComparison.OrdinalIgnoreCase) >= 0 ||
                d.Keywords.Any(k => k.IndexOf(searchKey, StringComparison.OrdinalIgnoreCase) >= 0)
            ).ToList();

            return Json(new { success = true, data = matchedDests }, JsonRequestBehavior.AllowGet);
        }
    }
}