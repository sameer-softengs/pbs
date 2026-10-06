// Published R1 stop coordinates: https://mnzil.app/vehicles/R-01 (2026-10-06).
// Stops run Khokhrapar to Dockyard; saved road geometry runs in reverse.
const publishedStops = [
  {
    "id": "R1_01",
    "name": "Khokhrapar",
    "lat": 24.903734563167,
    "lng": 67.206148740843
  },
  {
    "id": "R1_02",
    "name": "Saudabad Square",
    "lat": 24.90083,
    "lng": 67.20131
  },
  {
    "id": "R1_03",
    "name": "RCD Ground",
    "lat": 24.90042,
    "lng": 67.19637
  },
  {
    "id": "R1_04",
    "name": "Dak Khana - Model Colony",
    "lat": 24.902124620731687,
    "lng": 67.19040276949421
  },
  {
    "id": "R1_05",
    "name": "Awan Hotel - Model Colony",
    "lat": 24.902359008368325,
    "lng": 67.18925363694304
  },
  {
    "id": "R1_06",
    "name": "Lee Broast - Model Colony",
    "lat": 24.902872659305668,
    "lng": 67.18618835356655
  },
  {
    "id": "R1_07",
    "name": "Model Colony Mor",
    "lat": 24.904050223226456,
    "lng": 67.1828228310062
  },
  {
    "id": "R1_08",
    "name": "Moinabad",
    "lat": 24.89877142355372,
    "lng": 67.17970327672147
  },
  {
    "id": "R1_09",
    "name": "Shah Faisal Town",
    "lat": 24.89286647452003,
    "lng": 67.17790051395839
  },
  {
    "id": "R1_10",
    "name": "Security Printing Press",
    "lat": 24.890623011387657,
    "lng": 67.17745571622538
  },
  {
    "id": "R1_11",
    "name": "Malir Halt",
    "lat": 24.88463008674756,
    "lng": 67.17536176711718
  },
  {
    "id": "R1_12",
    "name": "Wireless Gate Bus Stop",
    "lat": 24.885739661799796,
    "lng": 67.16812637371844
  },
  {
    "id": "R1_13",
    "name": "Chhota Gate",
    "lat": 24.887028329050832,
    "lng": 67.16192999469928
  },
  {
    "id": "R1_14",
    "name": "Airport",
    "lat": 24.886869763794593,
    "lng": 67.15801104345063
  },
  {
    "id": "R1_15",
    "name": "Star Gate - Shah Faisal Colony",
    "lat": 24.88701,
    "lng": 67.15577
  },
  {
    "id": "R1_16",
    "name": "Shah Faisal Colony Gate",
    "lat": 24.887071289689,
    "lng": 67.149698385386
  },
  {
    "id": "R1_17",
    "name": "Natha Khan",
    "lat": 24.887304926245363,
    "lng": 67.13628257326188
  },
  {
    "id": "R1_18",
    "name": "Drigh Road",
    "lat": 24.887026311756,
    "lng": 67.127672476251
  },
  {
    "id": "R1_19",
    "name": "PAF Base Faisal",
    "lat": 24.88390300804876,
    "lng": 67.11582714980888
  },
  {
    "id": "R1_20",
    "name": "Karsaz",
    "lat": 24.87542557218243,
    "lng": 67.09662765122896
  },
  {
    "id": "R1_21",
    "name": "PAF Museum",
    "lat": 24.87423718719,
    "lng": 67.094578817457
  },
  {
    "id": "R1_22",
    "name": "Awami Markaz",
    "lat": 24.87110305855181,
    "lng": 67.09007763517769
  },
  {
    "id": "R1_23",
    "name": "Baloch Colony Flyover",
    "lat": 24.867163709658,
    "lng": 67.083114551729
  },
  {
    "id": "R1_24",
    "name": "Fine House",
    "lat": 24.865578474190883,
    "lng": 67.07839537703299
  },
  {
    "id": "R1_25",
    "name": "Lal Kothi Shahrah-e-Faisal",
    "lat": 24.86238407749304,
    "lng": 67.06974480493226
  },
  {
    "id": "R1_26",
    "name": "Nursery",
    "lat": 24.860634444260025,
    "lng": 67.06285100526526
  },
  {
    "id": "R1_27",
    "name": "FTC Building",
    "lat": 24.859177872939448,
    "lng": 67.05262233463131
  },
  {
    "id": "R1_28",
    "name": "Gora Qabaristan",
    "lat": 24.857874266313,
    "lng": 67.048933578397
  },
  {
    "id": "R1_29",
    "name": "Aisha Bawany College",
    "lat": 24.857173620137,
    "lng": 67.045610443872
  },
  {
    "id": "R1_30",
    "name": "Sea Breeze Plaza",
    "lat": 24.857486669747118,
    "lng": 67.0439119314232
  },
  {
    "id": "R1_31",
    "name": "Regent Plaza",
    "lat": 24.855455003257,
    "lng": 67.038414210446
  },
  {
    "id": "R1_32",
    "name": "Mehran Hotel - Shahrah-e-Faisal Rd",
    "lat": 24.851996131527933,
    "lng": 67.03384560860408
  },
  {
    "id": "R1_33",
    "name": "Metropole",
    "lat": 24.850503932738,
    "lng": 67.029946258277
  },
  {
    "id": "R1_34",
    "name": "Karachi Press Club",
    "lat": 24.855150466715056,
    "lng": 67.02640072982985
  },
  {
    "id": "R1_35",
    "name": "Arts Council of Pakistan Karachi",
    "lat": 24.853074649009407,
    "lng": 67.02178772704838
  },
  {
    "id": "R1_36",
    "name": "Shaheen Complex",
    "lat": 24.8511366765971,
    "lng": 67.01955335983521
  },
  {
    "id": "R1_37",
    "name": "I.I. Chundrigar",
    "lat": 24.85074449263046,
    "lng": 67.01767526744095
  },
  {
    "id": "R1_38",
    "name": "Jang Press Booking Office",
    "lat": 24.850246133162212,
    "lng": 67.01575676679909
  },
  {
    "id": "R1_39",
    "name": "City Railway",
    "lat": 24.84963676426,
    "lng": 67.00613431152
  },
  {
    "id": "R1_40",
    "name": "HBL Plaza",
    "lat": 24.849945041979463,
    "lng": 67.00554947449714
  },
  {
    "id": "R1_41",
    "name": "NBP Head Office",
    "lat": 24.84918049002104,
    "lng": 67.00257759087995
  },
  {
    "id": "R1_42",
    "name": "Tower",
    "lat": 24.848311910809127,
    "lng": 66.99614382467792
  },
  {
    "id": "R1_43",
    "name": "Fishery Stop",
    "lat": 24.848461610458433,
    "lng": 66.98100386854928
  },
  {
    "id": "R1_44",
    "name": "Dockyard",
    "lat": 24.82987870787637,
    "lng": 66.97057111188934
  }
];

// Preserve the app coordinates for map markers; road projection is simulation-only.
export const route1Data = publishedStops.map(stop => ({
  ...stop,
  coordinateSource: "Mnzil R1 stop directory",
  sourceUrl: "https://mnzil.app/vehicles/R-01",
}));
