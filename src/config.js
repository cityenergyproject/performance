var EP_CONFIG = {
    "url_name": "seattle",
    "name": "Seattle Energy Benchmarking",
    "logo_link_url": "http://cityenergyproject.github.io/seattle/",
    "address_search_regional_context": "Seattle",
    "header_banner_images": [
        {
            "src": "images/seattle-skyline@2x.jpg",
            "href": null,
            "alt": "seattle skyline logo"
        }
    ],
    "backgroundTileSource": "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png",
    "labelTileSource": "https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png",
    "center": [
      47.61,
      -122.33
    ],
    "zoom": 12,
    "categoryDefaults": [],
    "cartoDbUser": "stamen-org",
    "property_id": "cartodb_id",
    "property_name": "property_name",
    "building_type": "property_type",
    "popup_fields": [
        {"field": "property_name", "label": ""},
        {"field": "reported_address", "label": ""},
        {"field": "zip", "label": ""},
        {"field": "id", "label": "Seattle Benchmarking building ID: "},
        {"field": "property_type", "label": "Property Type: "},
        {"field": "reported_gross_floor_area", "label": "Property Size (ft²): "},
        {"field": "yearbuilt", "label": "Year Built: ", "isYear": true},
        {"field": "total_ghg_emissions", "label": "Total GHG Emissions (Metric Tons CO₂e): "},
        {"field": "total_ghg_emissions_intensity", "label": "GHG Intensity (Kilograms CO₂e/ft²): "},
        {"field": "energy_star_score", "label": "ENERGY STAR Score: "},
        {"field": "site_eui", "label": "Site Energy Use Intensity (kBTU/ft²): "},
        {"field": "source_eui", "label": "Source EUI (kBTU/ft²): "},
        {"field": "comments", "label": "Comments: "},
        {"field": "neighborhood", "label": "Neighborhood: ", "start_hidden": true},
        {"field": "councildistrict", "label": "Council District: "},
        {"field": "numbuildings", "label": "Number of Buildings: ", "suppress_unless_field": "property_type", "suppress_unless_values": ["Multifamily Housing","High-Rise Multifamily","Mid-Rise Multifamily","Low-Rise Multifamily","Small- and Mid-Sized Office","Large Office","Medical Office"]},
        {"field": "numfloors", "label": "Number of Floors: ", "suppress_unless_field": "property_type", "suppress_unless_values": ["Multifamily Housing","High-Rise Multifamily","Mid-Rise Multifamily","Low-Rise Multifamily","Small- and Mid-Sized Office","Large Office","Medical Office"]},
        {"field": "numunits", "label": "Number of Units: ", "suppress_unless_field": "property_type", "suppress_unless_values": ["Multifamily Housing","High-Rise Multifamily","Mid-Rise Multifamily","Low-Rise Multifamily","Small- and Mid-Sized Office","Large Office","Medical Office"]}
    ],
    "map_layers": [
        {
            "title": "Neighborhood",
            "field_name": "neighborhood",
            "display_type": "category",
            "sort_by_key": true,
            "hide_other_category": true,
            "section": "Property Information",
            "description": "Neighborhood"
        },
        {
            "title": "Council District",
            "field_name": "councildistrict",
            "display_type": "category",
            "sort_by_key": true,
            "hide_other_category": true,
            "section": "Property Information",
            "description": "Council District"
        },
        {
            "title": "Property Type",
            "field_name": "property_type",
            "display_type": "category",
            "sort_by_key": true,
            "hide_other_category": true,
            "section": "Property Information",
            "description": "The Primary Use of the Property, as calculated by Portfolio Manager based on the owner's selections."
        },
        {
            "title": "Property Size",
            "field_name": "reported_gross_floor_area",
            "display_type": "range",
            "range_slice_count": 18,
            "color_range": ["#b8cba9","#007749"],
            "unit": "ft²",
            "filter_range": {"min": 20000, "max" : 500000},
            "section": "Property Information",
            "description": "The Gross Floor Area (GFA) is the total property square footage, measured between the outside surface of the exterior walls of the building(s). This includes all areas inside the building(s) including supporting areas. GFA is not the same as rentable space, but rather includes all area inside the building(s)."
        },
        {
            "title": "Year Built",
            "field_name": "yearbuilt",
            "display_type": "range",
            "range_slice_count": 18,
            "color_range": ["#b8cba9","#007749"],
            "section": "Property Information",
            "description": "The year property was constructed, as reported by owner"
        },
        {
            "title": "ENERGY STAR Score",
            "field_name": "energy_star_score",
            "display_type": "range",
            "range_slice_count": 18,
            "filter_range": {"min": 0, "max" : 100},
            "section": "Energy Performance Metrics",
            "color_range": ["#ab2328","#da863f","#ffd552","#599b67","#1f5dbe"],
            "description": "The 1-100 score calculated by ENERGY STAR® Portfolio Manager® that measures how well the property is performing relative to similar properties, when normalized for climate and operational characteristics. The 1-100 scale is set so that 1 represents the worst performing buildings and 100 represents the best performing buildings. A score of 50 indicates that a building is performing at the national median, taking into account its size, location, and operating parameters. A score of 75 indicates that at a property is performing in the 75th percentile and may be eligible to earn ENERGY STAR® Certification."
        },
        {
            "title": "Site Energy Use Intensity",
            "field_name": "site_eui",
            "display_type": "range",
            "range_slice_count": 18,
            "section": "Energy Performance Metrics",
            "color_range": ["#1f5dbe","#599b67","#ffd552","#da863f","#ab2328"],
            "unit": "kBTU/ft²",
            "filter_range": {"min": 0, "max" : 200},
            "description": "Non-Normalized Site Energy Use Intensity (EUI) is a property's Site Energy Use divided by its gross floor area. Site Energy Use is the annual amount of all the energy consumed by the property on-site, as reported on utility bills. Site EUI is measured in thousands of British thermal units (kBtu) per square foot."
        },
        {
            "title": "Source Energy Use Intensity",
            "field_name": "source_eui",
            "display_type": "range",
            "range_slice_count": 18,
            "section": "Energy Performance Metrics",
            "color_range": ["#1f5dbe","#599b67","#ffd552","#da863f","#ab2328"],
            "unit": "kBTU/ft²",
            "filter_range": {"min" : 0, "max" : 200},
            "description": "Non-Normalized Source Energy Use is a property’s Source Energy Use divided by property square footage. Source Energy Use is the total amount of raw fuel that is required to operate the property. In addition to what the property consumes on-site, source energy includes losses that take place during generation, transmission, and distribution of the energy, thereby enabling a complete assessment of energy consumption resulting from building operations. Source EUI is measured in thousands of British thermal units (kBtu) per square foot."
        },
        {
            "title": "Total Seattle GHG Emissions",
            "field_name": "total_ghg_emissions",
            "display_type": "range",
            "range_slice_count": 18,
            "section": "Greenhouse Gas Emissions",
            "color_range": ["#1f5dbe","#599b67","#ffd552","#da863f","#ab2328"],
            "unit": "Metric Tons CO₂e",
            "filter_range": {"min" : 0, "max" : 500},
            "description": "Greenhouse Gas (GHG) Emissions are the carbon dioxide (CO2), methane (CH4), and nitrous oxide (N2O) gases released into the atmosphere as a result of energy consumption at the property. GHG emissions are expressed in Metric Tons of carbon dioxide equivalent (CO2e), a universal unit of measure that combines the quantity and global warming potential of each greenhouse gas. Total Emissions is the sum of Direct Emissions (emissions associated with onsite fuel combustion) and Indirect Emissions (emissions associated with purchases of electricity, district steam, district hot water, or district chilled water). These emissions estimates are calculated from site electricity, natural gas, and steam energy use using GHG emissions factors. The calculation includes a custom factor from Seattle City Light for electricity, a default natural gas factor from the EPA, and a custom emissions factor from Enwave for steam."
        },
        {
            "title": "Seattle GHG Intensity",
            "field_name": "total_ghg_emissions_intensity",
            "display_type": "range",
            "range_slice_count": 18,
            "section": "Greenhouse Gas Emissions",
            "color_range": ["#1f5dbe","#599b67","#ffd552","#da863f","#ab2328"],
            "unit": "Kilograms CO₂e/ft²",
            "filter_range": {"min" : 0, "max" : 10},
            "description": "The total Greenhouse Gas (GHG) Emissions, divided by the floor area of the building, in kilograms of carbon dioxide equivalent (CO2e) per square foot."
        }
    ],
    "years": {
        "2015": {
            "table_name": "test_building_data_20000",
            "default_layer": "energy_star_score"
        }
    }
}
