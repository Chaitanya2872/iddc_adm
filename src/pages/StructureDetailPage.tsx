import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Building2,
  Download,
  FileText,
  ImageIcon,
  Home,
  Layers3,
  MapPinned,
  FolderKanban,
  MapPin
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import type {
  AdminAdministrativeResponse,
  AdminFlatsResponse,
  AdminFloorsResponse,
  AdminLocationResponse,
  AdminRatingsResponse,
  AdminStructureDetail
} from "@/types";

function formatStatus(value?: string) {
  if (!value) return "Draft";
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatRating(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return "";
  return value.toFixed(2);
}

function formatNumber(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return "";
  return String(value);
}

function formatComponentLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getPhotoList(item: Record<string, unknown>) {
  const photos = Array.isArray(item.photos) ? item.photos : [];
  const singlePhoto = typeof item.photo === "string" && item.photo ? [item.photo] : [];
  return [...singlePhoto, ...photos.filter((photo): photo is string => typeof photo === "string" && photo.trim().length > 0)];
}

function extractDetailedRatingGroups(ratingRecord?: Record<string, unknown> | null) {
  if (!ratingRecord) return [];

  return Object.entries(ratingRecord)
    .filter(([key, value]) => {
      if (["overall_average", "assessment_date", "inspector_notes", "health_status", "averages"].includes(key)) {
        return false;
      }
      return Array.isArray(value) && value.length > 0;
    })
    .map(([key, value]) => ({
      key,
      label: formatComponentLabel(key),
      notes: typeof ratingRecord.inspector_notes === "string" ? ratingRecord.inspector_notes : "",
      assessmentDate: typeof ratingRecord.assessment_date === "string" ? ratingRecord.assessment_date : "",
      items: (value as Array<Record<string, unknown>>).map((item) => ({
        name: typeof item.name === "string" ? item.name : "",
        rating: typeof item.rating === "number" ? item.rating : null,
        condition: typeof item.condition_comment === "string" ? item.condition_comment : "",
        inspectorNotes: typeof item.inspector_notes === "string" ? item.inspector_notes : "",
        repair: typeof item.repair_methodology === "string" ? item.repair_methodology : "",
        dimensions:
          item.distress_dimensions && typeof item.distress_dimensions === "object"
            ? [
                typeof (item.distress_dimensions as { length?: unknown }).length === "number"
                  ? `L ${String((item.distress_dimensions as { length?: number }).length)}`
                  : "",
                typeof (item.distress_dimensions as { breadth?: unknown }).breadth === "number"
                  ? `B ${String((item.distress_dimensions as { breadth?: number }).breadth)}`
                  : "",
                typeof (item.distress_dimensions as { height?: unknown }).height === "number"
                  ? `H ${String((item.distress_dimensions as { height?: number }).height)}`
                  : "",
                typeof (item.distress_dimensions as { unit?: unknown }).unit === "string"
                  ? String((item.distress_dimensions as { unit?: string }).unit)
                  : ""
              ]
                .filter(Boolean)
                .join(" | ")
            : "",
        distress:
          Array.isArray(item.distress_types) && item.distress_types.length
            ? item.distress_types.map((entry) => formatComponentLabel(String(entry))).join(", ")
            : "",
        photos: getPhotoList(item),
        inspectionDate: typeof item.inspection_date === "string" ? item.inspection_date : ""
      }))
    }));
}

function RatingGroupPanel({
  title,
  groups
}: {
  title: string;
  groups: Array<{
    key: string;
    label: string;
    notes: string;
    assessmentDate: string;
    items: Array<{
      name: string;
      rating: number | null;
      condition: string;
      inspectorNotes: string;
      repair: string;
      dimensions: string;
      distress: string;
      photos: string[];
      inspectionDate: string;
    }>;
  }>;
}) {
  return (
    <div className="rounded-[18px] border border-slate-200 bg-white p-3">
      <p className="text-[12px] font-medium uppercase tracking-[0.16em] text-slate-400">{title}</p>
      <div className="mt-3 space-y-3">
        {groups.length ? (
          groups.map((group) => (
            <div key={group.key} className="rounded-[14px] border border-slate-200 bg-slate-50 p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{group.label}</p>
                  {group.assessmentDate ? <p className="mt-1 text-[11px] text-slate-500">Assessed {formatDate(group.assessmentDate)}</p> : null}
                </div>
                <Badge>{group.items.length} items</Badge>
              </div>
              {group.notes ? <p className="mt-2 text-xs leading-5 text-slate-500">Section notes: {group.notes}</p> : null}
              <div className="mt-3 grid gap-2">
                {group.items.map((item, index) => (
                  <div className="rounded-[12px] border border-slate-200 bg-white p-3" key={`${group.key}-${index}`}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{item.name || `${group.label} ${index + 1}`}</p>
                        {item.inspectionDate ? <p className="mt-1 text-[11px] text-slate-500">Inspected {formatDate(item.inspectionDate)}</p> : null}
                      </div>
                      <div className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                        Rating {item.rating ?? "-"}
                      </div>
                    </div>

                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      {item.distress ? <p className="rounded-md bg-slate-50 px-2.5 py-2 text-xs text-slate-600"><span className="font-medium text-slate-800">Distress Types:</span> {item.distress}</p> : null}
                      {item.dimensions ? <p className="rounded-md bg-slate-50 px-2.5 py-2 text-xs text-slate-600"><span className="font-medium text-slate-800">Dimensions:</span> {item.dimensions}</p> : null}
                      {item.condition ? <p className="rounded-md bg-slate-50 px-2.5 py-2 text-xs text-slate-600"><span className="font-medium text-slate-800">Condition:</span> {item.condition}</p> : null}
                      {item.repair ? <p className="rounded-md bg-slate-50 px-2.5 py-2 text-xs text-slate-600"><span className="font-medium text-slate-800">Repair:</span> {item.repair}</p> : null}
                    </div>

                    {item.inspectorNotes ? <p className="mt-2 text-xs leading-5 text-slate-500">Notes: {item.inspectorNotes}</p> : null}

                    {item.photos.length ? (
                      <div className="mt-3">
                        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">
                          <ImageIcon className="h-3.5 w-3.5" />
                          Images
                        </div>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                          {item.photos.map((photo, photoIndex) => (
                            <a className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-100" href={photo} key={`${group.key}-${index}-${photoIndex}`} rel="noreferrer" target="_blank">
                              <img
                                alt={`${item.name || group.label} ${photoIndex + 1}`}
                                className="h-24 w-full object-cover transition-transform duration-150 group-hover:scale-[1.02]"
                                src={photo}
                              />
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-500">No detailed ratings available.</p>
        )}
      </div>
    </div>
  );
}

export function StructureDetailPage() {
  const { id = "" } = useParams();
  const [structure, setStructure] = useState<AdminStructureDetail | null>(null);
  const [locationData, setLocationData] = useState<AdminLocationResponse | null>(null);
  const [administrativeData, setAdministrativeData] = useState<AdminAdministrativeResponse | null>(null);
  const [floorsData, setFloorsData] = useState<AdminFloorsResponse | null>(null);
  const [flatsData, setFlatsData] = useState<AdminFlatsResponse | null>(null);
  const [ratingsData, setRatingsData] = useState<AdminRatingsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [downloadError, setDownloadError] = useState<string>("");
  const [downloading, setDownloading] = useState<"pdf" | "word" | "">("");
  const [activeTab, setActiveTab] = useState<"location" | "floors" | "flats" | "ratings">("location");

  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const [detailResponse, locationResponse, administrativeResponse, floorsResponse, flatsResponse, ratingsResponse] =
          await Promise.all([
            api.getAdminStructure(id),
            api.getAdminStructureLocation(id),
            api.getAdminStructureAdministrative(id),
            api.getAdminStructureFloors(id),
            api.getAdminStructureFlats(id),
            api.getAdminStructureRatings(id)
          ]);

        if (!ignore) {
          setStructure(detailResponse.data || null);
          setLocationData(locationResponse.data || null);
          setAdministrativeData(administrativeResponse.data || null);
          setFloorsData(floorsResponse.data || null);
          setFlatsData(flatsResponse.data || null);
          setRatingsData(ratingsResponse.data || null);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load structure");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    if (id) {
      load();
    } else {
      setLoading(false);
      setError("Structure id is missing");
    }

    return () => {
      ignore = true;
    };
  }, [id]);

  const metrics = useMemo(() => {
    const floorCount = floorsData?.total_floors ?? floorsData?.floors?.length ?? 0;
    const flatCount = flatsData?.total_flats ?? flatsData?.flats?.length ?? 0;
    const blockCount = (structure?.geometric_details?.floors || []).reduce(
      (sum, floor) => sum + (floor.blocks?.length || 0),
      0
    );

    return [
      {
        label: "Status",
        value: formatStatus(structure?.status),
        note: "Current workflow stage"
      },
      {
        label: "Floors",
        value: floorCount,
        note: "Configured levels"
      },
      {
        label: "Flats",
        value: flatCount,
        note: "Mapped flat count"
      },
      {
        label: "Blocks",
        value: blockCount,
        note: "Mapped block count"
      }
    ];
  }, [flatsData, floorsData, structure]);

  const locationDetails = useMemo(() => {
    if (!structure && !locationData) return [];

    return [
      {
        label: "State",
        value:
          locationData?.location?.state_code ||
          structure?.location?.state_code ||
          locationData?.structural_identity?.state_code ||
          structure?.structural_identity?.state_code ||
          ""
      },
      {
        label: "District",
        value:
          locationData?.location?.district_code ||
          structure?.location?.district_code ||
          locationData?.structural_identity?.district_code ||
          structure?.structural_identity?.district_code ||
          ""
      },
      {
        label: "City",
        value:
          locationData?.location?.city_name ||
          structure?.location?.city_name ||
          locationData?.structural_identity?.city_name ||
          structure?.structural_identity?.city_name ||
          ""
      },
      {
        label: "Location Code",
        value:
          locationData?.location?.location_code ||
          structure?.location?.location_code ||
          locationData?.structural_identity?.location_code ||
          structure?.structural_identity?.location_code ||
          ""
      },
      {
        label: "Address",
        value: locationData?.location?.address || structure?.location?.address || ""
      },
      {
        label: "Latitude",
        value: formatNumber(locationData?.location?.latitude)
      },
      {
        label: "Longitude",
        value: formatNumber(locationData?.location?.longitude)
      }
    ];
  }, [locationData, structure]);

  const mapCoordinates = useMemo(() => {
    const latitude = locationData?.location?.latitude;
    const longitude = locationData?.location?.longitude;

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return null;
    }

    return { latitude, longitude };
  }, [locationData]);

  const mapEmbedUrl = useMemo(() => {
    if (!mapCoordinates) return "";
    return `https://www.google.com/maps?q=${mapCoordinates.latitude},${mapCoordinates.longitude}&z=16&output=embed`;
  }, [mapCoordinates]);

  const mapOpenUrl = useMemo(() => {
    if (!mapCoordinates) return "";
    return `https://www.google.com/maps?q=${mapCoordinates.latitude},${mapCoordinates.longitude}`;
  }, [mapCoordinates]);

  const structureDetails = useMemo(() => {
    if (!structure) return [];

    return [
      {
        label: "Structure Number",
        value: structure.structural_identity?.structural_identity_number || ""
      },
      {
        label: "UID",
        value: structure.structural_identity?.uid || ""
      },
      {
        label: "Structure Type",
        value: structure.structural_identity?.type_of_structure || ""
      },
      {
        label: "Subtype",
        value: structure.structural_identity?.structure_subtype || ""
      },
      {
        label: "Structure Name",
        value: structure.structural_identity?.structure_name || ""
      },
      {
        label: "Created",
        value: formatDate(structure.creation_info?.created_date)
      },
      {
        label: "Last Updated",
        value: formatDate(structure.creation_info?.last_updated_date)
      }
    ];
  }, [structure]);

  const adminDetails = useMemo(() => {
    if (!structure) return [];

    return [
      {
        label: "Owner Username",
        value: structure.owner?.username || ""
      },
      {
        label: "Owner Email",
        value: structure.owner?.email || ""
      },
      {
        label: "Client Name",
        value: administrativeData?.administrative?.client_name || structure.administration?.client_name || ""
      },
      {
        label: "Organization",
        value: administrativeData?.administrative?.organization || structure.administration?.organization || ""
      },
      {
        label: "Custodian",
        value: administrativeData?.administrative?.custodian || structure.administration?.custodian || ""
      },
      {
        label: "Engineer Designation",
        value:
          administrativeData?.administrative?.engineer_designation ||
          structure.administration?.engineer_designation ||
          ""
      },
      {
        label: "Contact",
        value:
          administrativeData?.administrative?.contact_details ||
          administrativeData?.administrative?.email_id ||
          structure.administration?.contact_details ||
          structure.administration?.email_id ||
          ""
      }
    ];
  }, [administrativeData, structure]);

  const structureAdminPoints = useMemo(() => {
    const totalFloors = floorsData?.total_floors ?? floorsData?.floors?.length ?? 0;
    const totalFlats = ratingsData?.ratings_summary?.total_flats ?? flatsData?.total_flats ?? 0;
    const ratedFlats = ratingsData?.ratings_summary?.rated_flats ?? 0;
    const ratedFloors = ratingsData?.floors?.filter((floor) => floor.floor_overall_rating?.health_status).length ?? 0;
    const highPriorityFloors =
      ratingsData?.floors?.filter((floor) =>
        ["Critical", "High"].includes(floor.floor_overall_rating?.priority || "")
      ).length ?? 0;

    return [
      {
        label: "Location Readiness",
        value: locationDetails.filter((item) => item.value).length,
        note: "Mapped location fields at structure level"
      },
      {
        label: "Floor Coverage",
        value: `${ratedFloors}/${totalFloors || 0}`,
        note: "Floors carrying overall ratings"
      },
      {
        label: "Flat Coverage",
        value: `${ratedFlats}/${totalFlats || 0}`,
        note: "Flats carrying combined scores"
      },
      {
        label: "Priority Watch",
        value: highPriorityFloors,
        note: "Floors flagged as high or critical priority"
      }
    ];
  }, [flatsData, floorsData, locationDetails, ratingsData]);

  const floorCards = useMemo(() => {
    const ratingMap = new Map((ratingsData?.floors || []).map((floor) => [floor.floor_id, floor]));
    const blockMap = new Map(
      (structure?.geometric_details?.floors || []).map((floor) => [floor.floor_id, floor.blocks?.length || 0])
    );

    return (floorsData?.floors || []).map((floor) => {
      const ratingRow = ratingMap.get(floor.floor_id);
      return {
        id: floor.mongodb_id || floor.floor_id,
        name: floor.floor_label_name || `Floor ${floor.floor_number ?? ""}`.trim(),
        floorNumber: floor.floor_number,
        flats: floor.number_of_flats || 0,
        blocks: blockMap.get(floor.floor_id) || 0,
        height: formatNumber(floor.floor_height),
        area: formatNumber(floor.total_area_sq_mts),
        isParking: floor.is_parking_floor ? "Yes" : "No",
        parkingType: floor.parking_floor_type || "",
        notes: floor.floor_notes || "",
        overallAverage: formatRating(
          ratingRow?.floor_overall_rating?.overall_average ?? ratingRow?.floor_overall_rating?.combined_score
        ),
        healthStatus: ratingRow?.floor_overall_rating?.health_status || "",
        priority: ratingRow?.floor_overall_rating?.priority || "",
        structuralAverage: formatRating(ratingRow?.structural_rating?.overall_average),
        nonStructuralAverage: formatRating(ratingRow?.non_structural_rating?.overall_average)
      };
    });
  }, [floorsData, ratingsData, structure]);

  const flatCards = useMemo(() => {
    return (flatsData?.flats || []).map((flat) => ({
      id: flat.flat_id || `${flat.floor_id}-${flat.flat_number}`,
      floorName: flat.floor_label_name || `Floor ${flat.floor_number ?? ""}`.trim(),
      floorNumber: flat.floor_number,
      flatNumber: flat.flat_number || "",
      flatType: flat.flat_type || "",
      area: formatNumber(flat.area_sq_mts),
      directionFacing: flat.direction_facing || "",
      occupancyStatus: flat.occupancy_status || "",
      notes: flat.flat_notes || "",
      combinedScore: formatRating(flat.flat_overall_rating?.combined_score),
      healthStatus: flat.flat_overall_rating?.health_status || "",
      priority: flat.flat_overall_rating?.priority || "",
      structuralAverage: formatRating(flat.structural_rating?.overall_average),
      nonStructuralAverage: formatRating(flat.non_structural_rating?.overall_average)
    }));
  }, [flatsData]);

  const ratingSummary = useMemo(() => {
    return {
      average: formatRating(ratingsData?.ratings_summary?.avg_structural_rating),
      nonStructuralAverage: formatRating(ratingsData?.ratings_summary?.avg_non_structural_rating),
      health: ratingsData?.ratings_summary?.overall_health || "",
      completion: ratingsData?.ratings_summary?.completion_percentage ?? ""
    };
  }, [ratingsData]);

  const floorWiseRatingRows = useMemo(() => {
    return (ratingsData?.floors || []).map((floor) => ({
      id: floor.mongodb_id || floor.floor_id || `${floor.floor_number}`,
      floorName: floor.floor_label_name || `Floor ${floor.floor_number ?? ""}`.trim(),
      overallAverage: formatRating(
        floor.floor_overall_rating?.overall_average ?? floor.floor_overall_rating?.combined_score
      ),
      structuralAverage: formatRating(floor.structural_rating?.overall_average),
      nonStructuralAverage: formatRating(floor.non_structural_rating?.overall_average),
      healthStatus: floor.floor_overall_rating?.health_status || "",
      priority: floor.floor_overall_rating?.priority || "",
      ratedFlats: floor.rated_flats || 0
    }));
  }, [ratingsData]);

  const detailedFloorRatings = useMemo(() => {
    return (structure?.floors || []).map((floor) => ({
      id: floor.mongodb_id || floor.floor_id || `${floor.floor_number}`,
      floorName: floor.floor_label_name || `Floor ${floor.floor_number ?? ""}`.trim(),
      structuralGroups: extractDetailedRatingGroups(floor.floor_structural_rating || null),
      nonStructuralGroups: extractDetailedRatingGroups(floor.floor_non_structural_rating || null),
      structuralAverage:
        formatRating(floor.floor_structural_rating?.overall_average ?? floor.floor_statistics?.structural_average) || "",
      nonStructuralAverage:
        formatRating(floor.floor_non_structural_rating?.overall_average ?? floor.floor_statistics?.non_structural_average) || "",
      healthStatus: floor.floor_overall_rating?.health_status || floor.floor_structural_rating?.health_status || "",
      priority: floor.floor_overall_rating?.priority || "",
      structuralCount: floor.floor_statistics?.structural_components || 0,
      nonStructuralCount: floor.floor_statistics?.non_structural_components || 0
    }));
  }, [structure]);

  const tabItems = [
    { key: "location", label: "Location", icon: MapPinned },
    { key: "floors", label: "Floors", icon: Layers3 },
    { key: "flats", label: "Flats", icon: Home },
    { key: "ratings", label: "Floor Wise Ratings", icon: Activity }
  ] as const;

  const handleDownload = async (format: "pdf" | "word") => {
    if (!id) return;
    try {
      setDownloading(format);
      setDownloadError("");
      if (format === "pdf") {
        await api.downloadStructureReportPdf(id);
      } else {
        await api.downloadStructureReportWord(id);
      }
    } catch (downloadIssue) {
      setDownloadError(downloadIssue instanceof Error ? downloadIssue.message : "Download failed");
    } finally {
      setDownloading("");
    }
  };

  return (
    <AppShell
      action={
        <Button asChild className="rounded-full px-4" variant="outline">
          <Link to="/structures">
            <ArrowLeft className="h-4 w-4" />
            Back to list
          </Link>
        </Button>
      }
    >
      {loading ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading structure detail...</div>
      ) : error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-8 text-sm font-medium text-rose-600">{error}</div>
      ) : !structure ? (
        <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-sm text-slate-500">Structure not found.</div>
      ) : (
        <>
          <section className="mb-4 rounded-[26px] border border-slate-200 bg-white p-4">
            <div className="grid gap-4 xl:grid-cols-[160px_minmax(0,1fr)_auto]">
              <div className="min-h-[144px] rounded-[20px] bg-[linear-gradient(145deg,#eef2ff_0%,#c7d2fe_48%,#1e293b_100%)]" />
              <div className="flex flex-col justify-center gap-3">
                <div className="flex flex-wrap gap-2">
                  <Badge tone={structure.status}>{formatStatus(structure.status)}</Badge>
                  {structure.structural_identity?.uid ? <Badge>{structure.structural_identity.uid}</Badge> : null}
                  {structure.structural_identity?.type_of_structure ? <Badge>{structure.structural_identity.type_of_structure}</Badge> : null}
                </div>
                <h1 className="text-[2rem] font-semibold tracking-[-0.05em] text-slate-950">
                  {structure.structural_identity?.structural_identity_number || "Unnamed Structure"}
                </h1>
                <p className="max-w-3xl text-sm text-slate-500">
                  {administrativeData?.administrative?.client_name || structure.administration?.client_name || "No client name"} |{" "}
                  {[
                    locationData?.location?.city_name || structure.structural_identity?.city_name,
                    locationData?.location?.state_code || structure.structural_identity?.state_code
                  ]
                    .filter(Boolean)
                    .join(", ") || "Unknown location"}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 xl:items-end">
                <div className="flex flex-wrap gap-2">
                  <Badge>{structure.owner?.username || "Owner"}</Badge>
                  <Badge>{structure.owner?.email || "No email"}</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button className="h-10 rounded-full px-4 text-sm font-medium" disabled={downloading === "pdf"} onClick={() => void handleDownload("pdf")} variant="outline">
                    <Download className="h-4 w-4" />
                    {downloading === "pdf" ? "Downloading..." : "PDF Report"}
                  </Button>
                  <Button className="h-10 rounded-full px-4 text-sm font-medium" disabled={downloading === "word"} onClick={() => void handleDownload("word")} variant="outline">
                    <FileText className="h-4 w-4" />
                    {downloading === "word" ? "Downloading..." : "Word Report"}
                  </Button>
                </div>
              </div>
            </div>
            {downloadError ? <p className="mt-3 text-sm text-rose-600">{downloadError}</p> : null}
          </section>

          <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric, index) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 18 }}
                key={metric.label}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="h-full rounded-[22px]">
                  <CardContent className="p-4">
                    <p className="text-sm text-slate-500">{metric.label}</p>
                    <div className="mt-2 text-[1.7rem] font-semibold tracking-[-0.04em] text-slate-950">{metric.value}</div>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{metric.note}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {structureAdminPoints.map((point) => (
              <Card className="rounded-[22px]" key={point.label}>
                <CardContent className="p-4">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{point.label}</p>
                  <div className="mt-2 text-[1.55rem] font-medium tracking-[-0.04em] text-slate-950">{point.value}</div>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{point.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="rounded-[24px]">
            <CardContent className="p-4">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="admin-section-title">Structure Level Admin Points</p>
                  <p className="mt-2 text-xl font-medium tracking-[-0.04em] text-slate-950">Tabbed structure insights</p>
                </div>
                <div className="inline-flex flex-wrap gap-2 rounded-full border border-slate-200 bg-slate-50 p-1">
                  {tabItems.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
                          isActive ? "bg-white font-medium text-slate-950 shadow-sm" : "text-slate-500"
                        }`}
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        type="button"
                      >
                        <Icon className="h-4 w-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {activeTab === "location" ? (
                <div className="grid gap-3">
                  <div className="grid gap-3 xl:grid-cols-2">
                  <Card className="rounded-[22px] border-slate-200 shadow-none">
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="admin-section-title">Location</p>
                        <MapPin className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {locationDetails.map((item) => (
                          <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3" key={item.label}>
                            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                            <p className="mt-2 break-words text-[15px] font-medium text-slate-900">{item.value || " "}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[22px] border-slate-200 shadow-none">
                    <CardContent className="p-4">
                      <p className="admin-section-title">Admin Details</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {adminDetails.map((item) => (
                          <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3" key={item.label}>
                            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                            <p className="mt-2 break-words text-[15px] font-medium text-slate-900">{item.value || " "}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {structureDetails.map((item) => (
                          <div className="rounded-[18px] border border-slate-200 bg-white px-3 py-3" key={item.label}>
                            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                            <p className="mt-2 text-[15px] font-medium text-slate-900">{item.value || " "}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  </div>

                  <Card className="rounded-[22px] border-slate-200 shadow-none">
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="admin-section-title">Map View</p>
                        <MapPinned className="h-4 w-4 text-slate-400" />
                      </div>
                      {mapEmbedUrl ? (
                        <>
                          <div className="overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50">
                            <iframe
                              className="h-[340px] w-full"
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              src={mapEmbedUrl}
                              title="Structure location map"
                            />
                          </div>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3">
                            <p className="text-sm text-slate-600">
                              Coordinates: <span className="font-medium text-slate-900">{mapCoordinates?.latitude}</span>,{" "}
                              <span className="font-medium text-slate-900">{mapCoordinates?.longitude}</span>
                            </p>
                            <Button asChild className="rounded-md px-4" variant="outline">
                              <a href={mapOpenUrl} rel="noreferrer" target="_blank">
                                Open in Maps
                              </a>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-[18px] border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                          Latitude and longitude are not available for this structure yet.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : null}

              {activeTab === "floors" ? (
                floorCards.length ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {floorCards.map((floor) => (
                      <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3" key={floor.id || floor.name}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[16px] font-medium text-slate-900">{floor.name}</div>
                            <p className="text-xs text-slate-500">ID: {floor.id || "N/A"}</p>
                          </div>
                          <Building2 className="h-4 w-4 text-slate-400" />
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Admin points: this floor contains {floor.flats} flats, {floor.blocks} blocks, and carries a priority of {floor.priority || "not set"}.
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Floor No</p>
                            <p className="mt-1 text-lg font-medium text-slate-950">{floor.floorNumber ?? " "}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Flats</p>
                            <p className="mt-1 text-lg font-medium text-slate-950">{floor.flats}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Blocks</p>
                            <p className="mt-1 text-lg font-medium text-slate-950">{floor.blocks}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Height</p>
                            <p className="mt-1 text-sm font-medium text-slate-950">{floor.height || " "}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Area Sq Mts</p>
                            <p className="mt-1 text-sm font-medium text-slate-950">{floor.area || " "}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Parking Floor</p>
                            <p className="mt-1 text-sm font-medium text-slate-950">{floor.isParking}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Parking Type</p>
                            <p className="mt-1 text-sm font-medium text-slate-950">{floor.parkingType || " "}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Overall Avg</p>
                            <p className="mt-1 text-sm font-medium text-slate-950">{floor.overallAverage || " "}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Health</p>
                            <p className="mt-1 text-sm font-medium text-slate-950">{floor.healthStatus || " "}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Structural Avg</p>
                            <p className="mt-1 text-sm font-medium text-slate-950">{floor.structuralAverage || " "}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Non-Structural Avg</p>
                            <p className="mt-1 text-sm font-medium text-slate-950">{floor.nonStructuralAverage || " "}</p>
                          </div>
                        </div>
                        {floor.notes ? <p className="mt-3 text-xs leading-5 text-slate-500">Notes: {floor.notes}</p> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No floors are configured yet for this structure.
                  </div>
                )
              ) : null}

              {activeTab === "flats" ? (
                flatCards.length ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {flatCards.map((flat) => (
                      <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3" key={flat.id}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[15px] font-medium text-slate-900">{flat.flatNumber || "Unnamed Flat"}</p>
                            <p className="text-xs text-slate-500">{flat.floorName}</p>
                            <p className="text-xs text-slate-400">ID: {flat.id}</p>
                          </div>
                          <Home className="h-4 w-4 text-slate-400" />
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          Admin points: health is {flat.healthStatus || "not set"}, priority is {flat.priority || "not set"}, and combined score is {flat.combinedScore || "pending"}.
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Type</p>
                            <p className="mt-1 text-sm font-medium text-slate-900">{flat.flatType || " "}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Area Sq Mts</p>
                            <p className="mt-1 text-sm font-medium text-slate-900">{flat.area || " "}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Facing</p>
                            <p className="mt-1 text-sm font-medium text-slate-900">{flat.directionFacing || " "}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Occupancy</p>
                            <p className="mt-1 text-sm font-medium text-slate-900">{flat.occupancyStatus || " "}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Combined</p>
                            <p className="mt-1 text-sm font-medium text-slate-900">{flat.combinedScore || " "}</p>
                          </div>
                          <div className="rounded-2xl bg-white px-3 py-2">
                            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Priority</p>
                            <p className="mt-1 text-sm font-medium text-slate-900">{flat.priority || " "}</p>
                          </div>
                        </div>
                        {flat.notes ? <p className="mt-3 text-xs leading-5 text-slate-500">Notes: {flat.notes}</p> : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No flats are configured yet for this structure.
                  </div>
                )
              ) : null}

              {activeTab === "ratings" ? (
                <div className="grid gap-3">
                  <Card className="rounded-[22px] border-slate-200 shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="admin-section-title">Structure Rating Summary</p>
                          <p className="mt-2 text-xl font-medium tracking-[-0.04em] text-slate-950">Overall structure rating</p>
                        </div>
                        <Activity className="h-5 w-5 text-slate-400" />
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-4">
                        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Structural Avg</p>
                          <p className="mt-2 text-[1.35rem] font-medium text-slate-950">{ratingSummary.average || " "}</p>
                        </div>
                        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Non-Structural Avg</p>
                          <p className="mt-2 text-[1.35rem] font-medium text-slate-950">{ratingSummary.nonStructuralAverage || " "}</p>
                        </div>
                        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Health Status</p>
                          <p className="mt-2 text-[1.35rem] font-medium text-slate-950">{ratingSummary.health || " "}</p>
                        </div>
                        <div className="rounded-[18px] border border-slate-200 bg-slate-50 px-3 py-3">
                          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400">Completion</p>
                          <p className="mt-2 text-[1.35rem] font-medium text-slate-950">
                            {ratingSummary.completion === "" ? " " : `${ratingSummary.completion}%`}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {floorWiseRatingRows.length ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      {floorWiseRatingRows.map((floor) => (
                        <div className="rounded-[18px] border border-slate-200 bg-white p-3" key={floor.id}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{floor.floorName}</p>
                              <p className="mt-1 text-[11px] text-slate-500">Rated flats: {floor.ratedFlats}</p>
                            </div>
                            <FolderKanban className="h-4 w-4 text-slate-400" />
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="rounded-xl bg-slate-50 px-2.5 py-2">
                              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Overall</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{floor.overallAverage || " "}</p>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-2.5 py-2">
                              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Health</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{floor.healthStatus || " "}</p>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-2.5 py-2">
                              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Structural</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{floor.structuralAverage || " "}</p>
                            </div>
                            <div className="rounded-xl bg-slate-50 px-2.5 py-2">
                              <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">Non-Structural</p>
                              <p className="mt-1 text-sm font-semibold text-slate-900">{floor.nonStructuralAverage || " "}</p>
                            </div>
                          </div>
                          {floor.priority ? <p className="mt-2 text-xs text-slate-500">Priority: {floor.priority}</p> : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {detailedFloorRatings.length ? (
                    <div className="grid gap-4">
                      {detailedFloorRatings.map((floor) => (
                        <div className="rounded-[22px] border border-slate-200 bg-slate-50 p-4" key={floor.id}>
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-[16px] font-medium text-slate-900">{floor.floorName}</div>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                Detailed ratings for this floor, including individual structural and non-structural components.
                              </p>
                            </div>
                            <FolderKanban className="h-4 w-4 text-slate-400" />
                          </div>

                          <div className="mt-3 grid gap-2 md:grid-cols-3 xl:grid-cols-6">
                            <div className="rounded-2xl bg-white px-3 py-2">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Structural Avg</p>
                              <p className="mt-1 text-sm font-medium text-slate-900">{floor.structuralAverage || " "}</p>
                            </div>
                            <div className="rounded-2xl bg-white px-3 py-2">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Non-Structural Avg</p>
                              <p className="mt-1 text-sm font-medium text-slate-900">{floor.nonStructuralAverage || " "}</p>
                            </div>
                            <div className="rounded-2xl bg-white px-3 py-2">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Health</p>
                              <p className="mt-1 text-sm font-medium text-slate-900">{floor.healthStatus || " "}</p>
                            </div>
                            <div className="rounded-2xl bg-white px-3 py-2">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Priority</p>
                              <p className="mt-1 text-sm font-medium text-slate-900">{floor.priority || " "}</p>
                            </div>
                            <div className="rounded-2xl bg-white px-3 py-2">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Structural Items</p>
                              <p className="mt-1 text-sm font-medium text-slate-900">{floor.structuralCount}</p>
                            </div>
                            <div className="rounded-2xl bg-white px-3 py-2">
                              <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Non-Structural Items</p>
                              <p className="mt-1 text-sm font-medium text-slate-900">{floor.nonStructuralCount}</p>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-4 xl:grid-cols-2">
                            <RatingGroupPanel groups={floor.structuralGroups} title="Structural Ratings" />
                            <RatingGroupPanel groups={floor.nonStructuralGroups} title="Non-Structural Ratings" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[20px] border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      No floor-wise ratings are available yet for this structure.
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </>
      )}
    </AppShell>
  );
}
