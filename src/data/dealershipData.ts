// Comprehensive Branch, Mandal, and Village Directory with Distance & Google Maps Coordinates

export interface VillageInfo {
  name: string;
  teluguName?: string;
  distanceKm: number; // Road distance from the parent branch headquarters
  approxTravelTime?: string;
  lat?: number;
  lng?: number;
}

export interface MandalInfo {
  name: string;
  teluguName?: string;
  distanceFromBranchKm: number;
  villages: VillageInfo[];
}

export interface BranchInfo {
  id: string;
  name: string;
  teluguName: string;
  dealershipCode: '4731' | '4732';
  hubAddress: string;
  phone: string;
  mandals: MandalInfo[];
}

export interface DealershipInfo {
  code: '4731' | '4732';
  name: string;
  teluguName: string;
  branches: BranchInfo[];
  allMandals: string[];
}

export const DEALERSHIP_DATA: Record<'4731' | '4732', DealershipInfo> = {
  '4731': {
    code: '4731',
    name: 'Sri Gayathri Automotives - 4731 Hub',
    teluguName: 'శ్రీ గాయత్రి ఆటోమోటివ్స్ - 4731 కోడ్',
    allMandals: [
      'Agiripalle',
      'Chandarlapadu',
      'G Konduru',
      'Gannavaram',
      'Ibrahimpatnam',
      'Jaggayyapeta',
      'Kanchikacherla',
      'Kankipadu',
      'Nandigama',
      'Penuganchiprolu',
      'Vatsavai',
      'Veerullapadu',
      'Tiruvuru',
      'A.Konduru',
      'Gampalagudem',
      'Mylavaram',
      'Vissannapeta',
      'Nuzvidu',
      'Chatrai',
      'Reddygudem',
      'Musunur'
    ],
    branches: [
      {
        id: 'tiruvuru',
        name: 'Tiruvuru',
        teluguName: 'తిరువూరు',
        dealershipCode: '4731',
        hubAddress: 'Main Road, Near Bus Stand / Bypass, Tiruvuru, Krishna/NTR Dist',
        phone: '9848012345',
        mandals: [
          {
            name: 'Tiruvuru',
            teluguName: 'తిరువూరు',
            distanceFromBranchKm: 0,
            villages: [
              { name: 'Tiruvuru Town', teluguName: 'తిరువూరు టౌన్', distanceKm: 0, approxTravelTime: '0 min' },
              { name: 'Akkapalem', teluguName: 'అక్కపాలెం', distanceKm: 4, approxTravelTime: '8 min' },
              { name: 'Anjaneyapuram', teluguName: 'ఆంజనేయపురం', distanceKm: 6, approxTravelTime: '12 min' },
              { name: 'Chinnakorukondi', teluguName: 'చిన్నకోరుకొండి', distanceKm: 7, approxTravelTime: '14 min' },
              { name: 'Chintalapadu', teluguName: 'చింతలపాడు', distanceKm: 8, approxTravelTime: '15 min' },
              { name: 'Gani Atkur', teluguName: 'గాని అత్కూర్', distanceKm: 9, approxTravelTime: '18 min' },
              { name: 'Kokilampadu', teluguName: 'కోకిలంపాడు', distanceKm: 5, approxTravelTime: '10 min' },
              { name: 'Lakshmipuram', teluguName: 'లక్ష్మీపురం', distanceKm: 6, approxTravelTime: '12 min' },
              { name: 'Mallela', teluguName: 'మల్లెల', distanceKm: 7, approxTravelTime: '15 min' },
              { name: 'Mucharla', teluguName: 'ముచర్ల', distanceKm: 11, approxTravelTime: '20 min' },
              { name: 'Munukulla', teluguName: 'మునుకుళ్ళ', distanceKm: 8, approxTravelTime: '16 min' },
              { name: 'Nadirampadu', teluguName: 'నాదిరంపాడు', distanceKm: 10, approxTravelTime: '20 min' },
              { name: 'Patha Tiruvuru', teluguName: 'పాత తిరువూరు', distanceKm: 3, approxTravelTime: '6 min' },
              { name: 'Peddakorukondi', teluguName: 'పెద్దకోరుకొండి', distanceKm: 8, approxTravelTime: '16 min' },
              { name: 'Raju Peta', teluguName: 'రాజు పేట', distanceKm: 5, approxTravelTime: '10 min' },
              { name: 'Rolupadi', teluguName: 'రోలుపాడి', distanceKm: 9, approxTravelTime: '18 min' },
              { name: 'Suravaram', teluguName: 'సూరవరం', distanceKm: 10, approxTravelTime: '18 min' },
              { name: 'Vavilala', teluguName: 'వావిలాల', distanceKm: 12, approxTravelTime: '22 min' }
            ]
          },
          {
            name: 'A.Konduru',
            teluguName: 'ఎ.కొండూరు',
            distanceFromBranchKm: 14,
            villages: [
              { name: 'A.Konduru', teluguName: 'ఎ.కొండూరు', distanceKm: 14, approxTravelTime: '25 min' },
              { name: 'Atukuru', teluguName: 'ఆతుకూరు', distanceKm: 12, approxTravelTime: '20 min' },
              { name: 'Cheemalapadu', teluguName: 'చీమలపాడు', distanceKm: 16, approxTravelTime: '28 min' },
              { name: 'Golmandala', teluguName: 'గోల్మండల', distanceKm: 18, approxTravelTime: '32 min' },
              { name: 'Kambampadu', teluguName: 'కంబంపాడు', distanceKm: 11, approxTravelTime: '18 min' },
              { name: 'Koduru', teluguName: 'కోడూరు', distanceKm: 15, approxTravelTime: '26 min' },
              { name: 'Kummarigudem', teluguName: 'కుమ్మరిగూడెం', distanceKm: 17, approxTravelTime: '30 min' },
              { name: 'Madhavaram', teluguName: 'మాధవరం', distanceKm: 13, approxTravelTime: '22 min' },
              { name: 'Nagulavancha', teluguName: 'నాగులవంచ', distanceKm: 19, approxTravelTime: '34 min' },
              { name: 'Polisettipadu', teluguName: 'పోలిశెట్టిపాడు', distanceKm: 20, approxTravelTime: '35 min' },
              { name: 'Repudi', teluguName: 'రేపూడి', distanceKm: 16, approxTravelTime: '28 min' },
              { name: 'Vallampatla', teluguName: 'వల్లంపట్ల', distanceKm: 15, approxTravelTime: '27 min' }
            ]
          },
          {
            name: 'Gampalagudem',
            teluguName: 'గంపలగూడెం',
            distanceFromBranchKm: 18,
            villages: [
              { name: 'Gampalagudem', teluguName: 'గంపలగూడెం', distanceKm: 18, approxTravelTime: '30 min' },
              { name: 'Anumullanka', teluguName: 'అనుముల్లంక', distanceKm: 22, approxTravelTime: '38 min' },
              { name: 'Arlapadu', teluguName: 'ఆర్లపాడు', distanceKm: 16, approxTravelTime: '28 min' },
              { name: 'Dundiralapadu', teluguName: 'దుండిరాలపాడు', distanceKm: 20, approxTravelTime: '35 min' },
              { name: 'Gosaveedu', teluguName: 'గోసవీడు', distanceKm: 15, approxTravelTime: '26 min' },
              { name: 'Kanoor', teluguName: 'కానూరు', distanceKm: 21, approxTravelTime: '36 min' },
              { name: 'Khandrika', teluguName: 'ఖండ్రిక', distanceKm: 19, approxTravelTime: '32 min' },
              { name: 'Kotapadu', teluguName: 'కోటపాడు', distanceKm: 23, approxTravelTime: '40 min' },
              { name: 'Lingala', teluguName: 'లింగాల', distanceKm: 17, approxTravelTime: '29 min' },
              { name: 'Meduru', teluguName: 'మేదూరు', distanceKm: 24, approxTravelTime: '42 min' },
              { name: 'Nemali', teluguName: 'నెమలి', distanceKm: 25, approxTravelTime: '44 min' },
              { name: 'Pedakomira', teluguName: 'పెద్దకోమిర', distanceKm: 14, approxTravelTime: '24 min' },
              { name: 'Penugolanu', teluguName: 'పెనుగొలను', distanceKm: 16, approxTravelTime: '28 min' },
              { name: 'Rajavaram', teluguName: 'రాజవరం', distanceKm: 22, approxTravelTime: '38 min' },
              { name: 'Togummi', teluguName: 'తొగుమ్మి', distanceKm: 20, approxTravelTime: '35 min' },
              { name: 'Ummadidevarapalle', teluguName: 'ఉమ్మడిదేవరపల్లె', distanceKm: 21, approxTravelTime: '36 min' },
              { name: 'Vinagadapa', teluguName: 'వినగడప', distanceKm: 19, approxTravelTime: '33 min' }
            ]
          },
          {
            name: 'Vissannapeta',
            teluguName: 'విస్సన్నపేట',
            distanceFromBranchKm: 22,
            villages: [
              { name: 'Vissannapeta Town', teluguName: 'విస్సన్నపేట టౌన్', distanceKm: 22, approxTravelTime: '35 min' },
              { name: 'Chandrupatla', teluguName: 'చంద్రుపట్ల', distanceKm: 25, approxTravelTime: '40 min' },
              { name: 'Kalagara', teluguName: 'కలగర', distanceKm: 26, approxTravelTime: '42 min' },
              { name: 'Konduru', teluguName: 'కొండూరు', distanceKm: 24, approxTravelTime: '38 min' },
              { name: 'Korasapadu', teluguName: 'కొరసపాడు', distanceKm: 20, approxTravelTime: '32 min' },
              { name: 'Maddulaparva', teluguName: 'మద్దులపర్వ', distanceKm: 27, approxTravelTime: '45 min' },
              { name: 'Narsapuram', teluguName: 'నర్సాపురం', distanceKm: 23, approxTravelTime: '36 min' },
              { name: 'Putrela', teluguName: 'పుట్రేల', distanceKm: 28, approxTravelTime: '46 min' },
              { name: 'Siripuram', teluguName: 'సిరిపురం', distanceKm: 21, approxTravelTime: '34 min' },
              { name: 'Tatapudi', teluguName: 'తాతపూడి', distanceKm: 25, approxTravelTime: '40 min' },
              { name: 'Telladevarapalli', teluguName: 'తెల్లదేవరపల్లి', distanceKm: 29, approxTravelTime: '48 min' },
              { name: 'Vemireddypalli', teluguName: 'వేమిరెడ్డిపల్లి', distanceKm: 24, approxTravelTime: '38 min' }
            ]
          }
        ]
      },
      {
        id: 'nuzvidu',
        name: 'Nuzvidu',
        teluguName: 'నూజివీడు',
        dealershipCode: '4731',
        hubAddress: 'Bypass Road / Mylavaram Road Junction, Nuzvidu, Eluru / Krishna Dist',
        phone: '9848023456',
        mandals: [
          {
            name: 'Nuzvidu',
            teluguName: 'నూజివీడు',
            distanceFromBranchKm: 0,
            villages: [
              { name: 'Nuzvidu Town', teluguName: 'నూజివీడు టౌన్', distanceKm: 0, approxTravelTime: '0 min' },
              { name: 'Annavaram', teluguName: 'అన్నవరం', distanceKm: 5, approxTravelTime: '10 min' },
              { name: 'Borragudem', teluguName: 'బొర్రాగూడెం', distanceKm: 7, approxTravelTime: '14 min' },
              { name: 'Devaragunta', teluguName: 'దేవరగుంట', distanceKm: 6, approxTravelTime: '12 min' },
              { name: 'Gollanagudem', teluguName: 'గొల్లనగూడెం', distanceKm: 9, approxTravelTime: '18 min' },
              { name: 'Hanumanthunigudem', teluguName: 'హనుమంతునిగూడెం', distanceKm: 8, approxTravelTime: '15 min' },
              { name: 'Kethanakonda', teluguName: 'కేతనకొండ', distanceKm: 12, approxTravelTime: '22 min' },
              { name: 'Marribandam', teluguName: 'మర్రిబందం', distanceKm: 8, approxTravelTime: '16 min' },
              { name: 'Mekavaripalem', teluguName: 'మేకవారిపాలెం', distanceKm: 4, approxTravelTime: '8 min' },
              { name: 'Mirzapuram', teluguName: 'మిర్జాపురం', distanceKm: 10, approxTravelTime: '20 min' },
              { name: 'Morangapalli', teluguName: 'మోరంగాపల్లి', distanceKm: 11, approxTravelTime: '22 min' },
              { name: 'Pothireddypalli', teluguName: 'పోతిరెడ్డిపల్లి', distanceKm: 7, approxTravelTime: '14 min' },
              { name: 'Ramannagudem', teluguName: 'రామన్నగూడెం', distanceKm: 9, approxTravelTime: '18 min' },
              { name: 'Thukkuluru', teluguName: 'తుక్కులూరు', distanceKm: 6, approxTravelTime: '12 min' },
              { name: 'Venkata Krishna Puram', teluguName: 'వెంకట కృష్ణాపురం', distanceKm: 5, approxTravelTime: '10 min' }
            ]
          },
          {
            name: 'Chatrai',
            teluguName: 'చాత్రాయి',
            distanceFromBranchKm: 16,
            villages: [
              { name: 'Chatrai', teluguName: 'చాత్రాయి', distanceKm: 16, approxTravelTime: '28 min' },
              { name: 'Arugolanu', teluguName: 'అరుగోలను', distanceKm: 18, approxTravelTime: '32 min' },
              { name: 'Chanubanda', teluguName: 'చనుబండ', distanceKm: 21, approxTravelTime: '36 min' },
              { name: 'Chinnampet', teluguName: 'చిన్నంపేట', distanceKm: 14, approxTravelTime: '24 min' },
              { name: 'Gollagudem', teluguName: 'గొల్లగూడెం', distanceKm: 19, approxTravelTime: '34 min' },
              { name: 'Janardhanavaram', teluguName: 'జనార్ధనవరం', distanceKm: 15, approxTravelTime: '26 min' },
              { name: 'Kapavaram', teluguName: 'కాపవరం', distanceKm: 22, approxTravelTime: '38 min' },
              { name: 'Kothapalli', teluguName: 'కొత్తపల్లి', distanceKm: 17, approxTravelTime: '30 min' },
              { name: 'Manukondavari Khandrika', teluguName: 'మానుకొండవారి ఖండ్రిక', distanceKm: 20, approxTravelTime: '35 min' },
              { name: 'Parvathapuram', teluguName: 'పార్వతీపురం', distanceKm: 19, approxTravelTime: '33 min' },
              { name: 'Polavaram', teluguName: 'పోలవరం', distanceKm: 23, approxTravelTime: '40 min' },
              { name: 'Somavaram', teluguName: 'సోమవరం', distanceKm: 13, approxTravelTime: '22 min' }
            ]
          },
          {
            name: 'Musunur',
            teluguName: 'ముసునూరు',
            distanceFromBranchKm: 14,
            villages: [
              { name: 'Musunur', teluguName: 'ముసునూరు', distanceKm: 14, approxTravelTime: '25 min' },
              { name: 'Balive', teluguName: 'బలివె', distanceKm: 18, approxTravelTime: '30 min' },
              { name: 'Chekkapalli', teluguName: 'చెక్కపల్లి', distanceKm: 12, approxTravelTime: '20 min' },
              { name: 'Chillaragudem', teluguName: 'చిల్లరగూడెం', distanceKm: 16, approxTravelTime: '28 min' },
              { name: 'Chintalavalli', teluguName: 'చింతలవల్లి', distanceKm: 15, approxTravelTime: '26 min' },
              { name: 'Gollagudem', teluguName: 'గొల్లగూడెం', distanceKm: 17, approxTravelTime: '29 min' },
              { name: 'Gopavaram', teluguName: 'గోపవరం', distanceKm: 19, approxTravelTime: '32 min' },
              { name: 'Katrenipadu', teluguName: 'కాత్రేనిపాడు', distanceKm: 13, approxTravelTime: '22 min' },
              { name: 'Korlagunta', teluguName: 'కోర్లగుంట', distanceKm: 20, approxTravelTime: '34 min' },
              { name: 'Ramanakkapeta', teluguName: 'రామనక్కపేట', distanceKm: 11, approxTravelTime: '18 min' },
              { name: 'Surepalli', teluguName: 'సురేపల్లి', distanceKm: 17, approxTravelTime: '29 min' },
              { name: 'Talarlapalle', teluguName: 'తలార్లపల్లె', distanceKm: 21, approxTravelTime: '36 min' },
              { name: 'Velpucherla', teluguName: 'వెల్పుచర్ల', distanceKm: 16, approxTravelTime: '27 min' }
            ]
          },
          {
            name: 'Reddygudem',
            teluguName: 'రెడ్డిగూడెం',
            distanceFromBranchKm: 21,
            villages: [
              { name: 'Reddygudem', teluguName: 'రెడ్డిగూడెం', distanceKm: 21, approxTravelTime: '35 min' },
              { name: 'Annavaram', teluguName: 'అన్నవరం', distanceKm: 24, approxTravelTime: '40 min' },
              { name: 'Kudapa', teluguName: 'కుదప', distanceKm: 19, approxTravelTime: '32 min' },
              { name: 'Kunaparajuparva', teluguName: 'కూనపరాజుపర్వ', distanceKm: 22, approxTravelTime: '36 min' },
              { name: 'Maddulaparva', teluguName: 'మద్దులపర్వ', distanceKm: 25, approxTravelTime: '42 min' },
              { name: 'Naguluru', teluguName: 'నాగులూరు', distanceKm: 26, approxTravelTime: '44 min' },
              { name: 'Patha Naguluru', teluguName: 'పాత నాగులూరు', distanceKm: 27, approxTravelTime: '46 min' },
              { name: 'Raghavapuram', teluguName: 'రాఘవాపురం', distanceKm: 18, approxTravelTime: '30 min' },
              { name: 'Rangapuram', teluguName: 'రంగాపురం', distanceKm: 23, approxTravelTime: '38 min' },
              { name: 'Rudravaram', teluguName: 'రుద్రవరం', distanceKm: 20, approxTravelTime: '34 min' },
              { name: 'Seetharampuram', teluguName: 'సీతారాంపురం', distanceKm: 28, approxTravelTime: '48 min' }
            ]
          },
          {
            name: 'Agiripalle',
            teluguName: 'ఆగిరిపల్లె',
            distanceFromBranchKm: 18,
            villages: [
              { name: 'Agiripalle', teluguName: 'ఆగిరిపల్లె', distanceKm: 18, approxTravelTime: '30 min' },
              { name: 'Adakkaswamy', teluguName: 'అడక్కస్వామి', distanceKm: 22, approxTravelTime: '36 min' },
              { name: 'Boddanapalli', teluguName: 'బొద్దనపల్లి', distanceKm: 16, approxTravelTime: '26 min' },
              { name: 'Chinagollapalem', teluguName: 'చినగొల్లపాలెం', distanceKm: 20, approxTravelTime: '34 min' },
              { name: 'Chopparametla', teluguName: 'చొప్పరమెట్ల', distanceKm: 19, approxTravelTime: '32 min' },
              { name: 'Garikapadu', teluguName: 'గరికపాడు', distanceKm: 23, approxTravelTime: '38 min' },
              { name: 'Kalaturu', teluguName: 'కలటూరు', distanceKm: 21, approxTravelTime: '35 min' },
              { name: 'Kanasanapalle', teluguName: 'కనసనపల్లె', distanceKm: 17, approxTravelTime: '28 min' },
              { name: 'Malleswaram', teluguName: 'మల్లేశ్వరం', distanceKm: 24, approxTravelTime: '40 min' },
              { name: 'Nugondapalli', teluguName: 'నూగొండపల్లి', distanceKm: 15, approxTravelTime: '25 min' },
              { name: 'Suravaram', teluguName: 'సూరవరం', distanceKm: 25, approxTravelTime: '42 min' },
              { name: 'Thotapalli', teluguName: 'తోటపల్లి', distanceKm: 14, approxTravelTime: '22 min' },
              { name: 'Vadapalli', teluguName: 'వాడపల్లి', distanceKm: 20, approxTravelTime: '33 min' }
            ]
          },
          {
            name: 'Mylavaram',
            teluguName: 'మైలవరం',
            distanceFromBranchKm: 28,
            villages: [
              { name: 'Mylavaram Town', teluguName: 'మైలవరం టౌన్', distanceKm: 28, approxTravelTime: '45 min' },
              { name: 'Chandragudem', teluguName: 'చంద్రగూడెం', distanceKm: 24, approxTravelTime: '38 min' },
              { name: 'Chandrala', teluguName: 'చంద్రాల', distanceKm: 30, approxTravelTime: '48 min' },
              { name: 'Ganapavaram', teluguName: 'గణపవరం', distanceKm: 26, approxTravelTime: '42 min' },
              { name: 'Gopinenipalem', teluguName: 'గోపినేనిపాలెం', distanceKm: 32, approxTravelTime: '50 min' },
              { name: 'Kethaveeruni Padu', teluguName: 'కేతవీరుని పాడు', distanceKm: 31, approxTravelTime: '49 min' },
              { name: 'Morusu Melli', teluguName: 'మొరుసు మెల్లి', distanceKm: 25, approxTravelTime: '40 min' },
              { name: 'Pondugala', teluguName: 'పొందుగల', distanceKm: 27, approxTravelTime: '44 min' },
              { name: 'Pulluru', teluguName: 'పుల్లూరు', distanceKm: 33, approxTravelTime: '52 min' },
              { name: 'Sabjapadu', teluguName: 'సబ్జాపాడు', distanceKm: 29, approxTravelTime: '46 min' },
              { name: 'Tolukodu', teluguName: 'తోలుకోడు', distanceKm: 34, approxTravelTime: '55 min' },
              { name: 'Vedurubeedem', teluguName: 'వెదురుబీడెం', distanceKm: 26, approxTravelTime: '42 min' }
            ]
          },
          {
            name: 'G Konduru',
            teluguName: 'జి.కొండూరు',
            distanceFromBranchKm: 34,
            villages: [
              { name: 'G.Konduru', teluguName: 'జి.కొండూరు', distanceKm: 34, approxTravelTime: '52 min' },
              { name: 'Atukuru', teluguName: 'ఆతుకూరు', distanceKm: 36, approxTravelTime: '55 min' },
              { name: 'Chegireddypadu', teluguName: 'చేగిరెడ్డిపాడు', distanceKm: 32, approxTravelTime: '48 min' },
              { name: 'Ganginenipalem', teluguName: 'గంగినేనిపాలెం', distanceKm: 38, approxTravelTime: '58 min' },
              { name: 'Gurrajupalem', teluguName: 'గుర్రాజుపాలెం', distanceKm: 35, approxTravelTime: '54 min' },
              { name: 'Kavuluru', teluguName: 'కావులూరు', distanceKm: 39, approxTravelTime: '60 min' },
              { name: 'Koduru', teluguName: 'కోడూరు', distanceKm: 37, approxTravelTime: '56 min' },
              { name: 'Kuntamukkala', teluguName: 'కుంటముక్కల', distanceKm: 31, approxTravelTime: '47 min' },
              { name: 'Munagapadu', teluguName: 'మునగపాడు', distanceKm: 33, approxTravelTime: '50 min' },
              { name: 'Nandigama', teluguName: 'నందిగామ', distanceKm: 40, approxTravelTime: '62 min' },
              { name: 'Telladevarapalle', teluguName: 'తెల్లదేవరపల్లె', distanceKm: 36, approxTravelTime: '55 min' },
              { name: 'Velagaleru', teluguName: 'వెలగలేరు', distanceKm: 30, approxTravelTime: '45 min' }
            ]
          },
          {
            name: 'Gannavaram',
            teluguName: 'గన్నవరం',
            distanceFromBranchKm: 32,
            villages: [
              { name: 'Gannavaram Town', teluguName: 'గన్నవరం టౌన్', distanceKm: 32, approxTravelTime: '45 min' },
              { name: 'Allapuram', teluguName: 'అల్లాపురం', distanceKm: 35, approxTravelTime: '50 min' },
              { name: 'Bahubalendrunigudem', teluguName: 'బాహుబలేంద్రునిగూడెం', distanceKm: 28, approxTravelTime: '40 min' },
              { name: 'Budhavaram', teluguName: 'బుద్ధవరం', distanceKm: 34, approxTravelTime: '48 min' },
              { name: 'Chinnagannavaram', teluguName: 'చిన్నగన్నవరం', distanceKm: 33, approxTravelTime: '46 min' },
              { name: 'Kesarapalle', teluguName: 'కేసరపల్లె', distanceKm: 36, approxTravelTime: '52 min' },
              { name: 'Mustabad', teluguName: 'ముస్తాబాద్', distanceKm: 38, approxTravelTime: '55 min' },
              { name: 'Purushothapatnam', teluguName: 'పురుషోత్తపట్నం', distanceKm: 30, approxTravelTime: '42 min' },
              { name: 'Savaram', teluguName: 'సవరము', distanceKm: 26, approxTravelTime: '38 min' },
              { name: 'Surampalli', teluguName: 'సూరంపల్లి', distanceKm: 27, approxTravelTime: '39 min' },
              { name: 'Veerapanenigudem', teluguName: 'వీరపనేనిగూడెం', distanceKm: 35, approxTravelTime: '50 min' }
            ]
          }
        ]
      },
      {
        id: 'nandigama',
        name: 'Nandigama',
        teluguName: 'నందిగామ',
        dealershipCode: '4731',
        hubAddress: 'NH-65 Highway / Main Bazaar, Nandigama, NTR District',
        phone: '9848034567',
        mandals: [
          {
            name: 'Nandigama',
            teluguName: 'నందిగామ',
            distanceFromBranchKm: 0,
            villages: [
              { name: 'Nandigama Town', teluguName: 'నందిగామ టౌన్', distanceKm: 0, approxTravelTime: '0 min' },
              { name: 'Adaviravulapadu', teluguName: 'అడవిరావులపాడు', distanceKm: 7, approxTravelTime: '14 min' },
              { name: 'Ambarupeta', teluguName: 'అంబరుపేట', distanceKm: 6, approxTravelTime: '12 min' },
              { name: 'Damuluru', teluguName: 'దాములూరు', distanceKm: 9, approxTravelTime: '18 min' },
              { name: 'Gollamudi', teluguName: 'గొల్లమూడి', distanceKm: 8, approxTravelTime: '16 min' },
              { name: 'Jonnalagadda', teluguName: 'జొన్నలగడ్డ', distanceKm: 5, approxTravelTime: '10 min' },
              { name: 'Kanchachelapadu', teluguName: 'కంచచెర్లపాడు', distanceKm: 10, approxTravelTime: '20 min' },
              { name: 'Kethaveerunipadu', teluguName: 'కేతవీరునిపాడు', distanceKm: 12, approxTravelTime: '24 min' },
              { name: 'Konduru', teluguName: 'కొండూరు', distanceKm: 8, approxTravelTime: '16 min' },
              { name: 'Kurugantivari Khandrika', teluguName: 'కురుగంటివారి ఖండ్రిక', distanceKm: 11, approxTravelTime: '22 min' },
              { name: 'Lachapalem', teluguName: 'లాచపాలెం', distanceKm: 4, approxTravelTime: '8 min' },
              { name: 'Lingalapadu', teluguName: 'లింగాలపాడు', distanceKm: 6, approxTravelTime: '12 min' },
              { name: 'Magallu', teluguName: 'మగల్లు', distanceKm: 13, approxTravelTime: '25 min' },
              { name: 'Munagacherla', teluguName: 'మునగచర్ల', distanceKm: 7, approxTravelTime: '14 min' },
              { name: 'Pallagiri', teluguName: 'పల్లగిరి', distanceKm: 9, approxTravelTime: '18 min' },
              { name: 'Pedavaram', teluguName: 'పెద్దవరం', distanceKm: 5, approxTravelTime: '10 min' },
              { name: 'Raghunadhapalem', teluguName: 'రఘునాథపాలెం', distanceKm: 8, approxTravelTime: '16 min' },
              { name: 'Ramapuram', teluguName: 'రామాపురం', distanceKm: 10, approxTravelTime: '20 min' },
              { name: 'Rudravaram', teluguName: 'రుద్రవరం', distanceKm: 11, approxTravelTime: '22 min' },
              { name: 'Somavaram', teluguName: 'సోమవరం', distanceKm: 7, approxTravelTime: '14 min' },
              { name: 'Torragudipadu', teluguName: 'తొర్రగుడిపాడు', distanceKm: 12, approxTravelTime: '24 min' }
            ]
          },
          {
            name: 'Chandarlapadu',
            teluguName: 'చందర్లపాడు',
            distanceFromBranchKm: 16,
            villages: [
              { name: 'Chandarlapadu', teluguName: 'చందర్లపాడు', distanceKm: 16, approxTravelTime: '28 min' },
              { name: 'Bobbellapadu', teluguName: 'బొబ్బెళ్లపాడు', distanceKm: 18, approxTravelTime: '32 min' },
              { name: 'Chintalapadu', teluguName: 'చింతలపాడు', distanceKm: 21, approxTravelTime: '36 min' },
              { name: 'Eturu', teluguName: 'ఏటూరు', distanceKm: 23, approxTravelTime: '40 min' },
              { name: 'Gudimetla', teluguName: 'గుడిమెట్ల', distanceKm: 19, approxTravelTime: '34 min' },
              { name: 'Kasiravupalem', teluguName: 'కాసిరావుపాలెం', distanceKm: 22, approxTravelTime: '38 min' },
              { name: 'Kodavatikallu', teluguName: 'కోడవటికల్లు', distanceKm: 20, approxTravelTime: '35 min' },
              { name: 'Konayapalem', teluguName: 'కోనాయపాలెం', distanceKm: 24, approxTravelTime: '42 min' },
              { name: 'Munagalapalle', teluguName: 'మునగాలపల్లె', distanceKm: 17, approxTravelTime: '30 min' },
              { name: 'Muppalla', teluguName: 'ముప్పాళ్ళ', distanceKm: 25, approxTravelTime: '44 min' },
              { name: 'Pokkunuru', teluguName: 'పొక్కునూరు', distanceKm: 14, approxTravelTime: '25 min' },
              { name: 'Popuru', teluguName: 'పోపూరు', distanceKm: 22, approxTravelTime: '38 min' },
              { name: 'Punnavalli', teluguName: 'పున్నవల్లి', distanceKm: 18, approxTravelTime: '32 min' },
              { name: 'Thurlapadu', teluguName: 'తుర్లపాడు', distanceKm: 26, approxTravelTime: '45 min' },
              { name: 'Veladi', teluguName: 'వెలది', distanceKm: 15, approxTravelTime: '26 min' }
            ]
          },
          {
            name: 'Jaggayyapeta',
            teluguName: 'జగ్గయ్యపేట',
            distanceFromBranchKm: 25,
            villages: [
              { name: 'Jaggayyapeta Town', teluguName: 'జగ్గయ్యపేట టౌన్', distanceKm: 25, approxTravelTime: '35 min' },
              { name: 'Annavaram', teluguName: 'అన్నవరం', distanceKm: 28, approxTravelTime: '40 min' },
              { name: 'Balusupadu', teluguName: 'బలుసుపాడు', distanceKm: 26, approxTravelTime: '38 min' },
              { name: 'Bandipalem', teluguName: 'బండిపాలెం', distanceKm: 30, approxTravelTime: '44 min' },
              { name: 'Budavada', teluguName: 'బుదవడ', distanceKm: 27, approxTravelTime: '39 min' },
              { name: 'Chillakallu', teluguName: 'చిల్లకల్లు', distanceKm: 22, approxTravelTime: '32 min' },
              { name: 'Gandrayi', teluguName: 'గండ్రాయి', distanceKm: 34, approxTravelTime: '50 min' },
              { name: 'Garikapadu', teluguName: 'గరికపాడు', distanceKm: 29, approxTravelTime: '42 min' },
              { name: 'Kowthavari Agraharam', teluguName: 'కౌతవారి అగ్రహారం', distanceKm: 31, approxTravelTime: '46 min' },
              { name: 'Malkapuram', teluguName: 'మల్కాపురం', distanceKm: 24, approxTravelTime: '35 min' },
              { name: 'Muktyala', teluguName: 'ముత్యాల', distanceKm: 33, approxTravelTime: '48 min' },
              { name: 'Pocharam', teluguName: 'పోచారం', distanceKm: 32, approxTravelTime: '47 min' },
              { name: 'Ramachandrunipeta', teluguName: 'రామచంద్రునిపేట', distanceKm: 26, approxTravelTime: '38 min' },
              { name: 'Ravirala', teluguName: 'రవిరాల', distanceKm: 35, approxTravelTime: '52 min' },
              { name: 'Shermohammadpeta', teluguName: 'షేర్ మహమ్మద్ పేట', distanceKm: 27, approxTravelTime: '40 min' },
              { name: 'Torraguntapalem', teluguName: 'తొర్రగుంటపాలెం', distanceKm: 30, approxTravelTime: '45 min' },
              { name: 'Vedadri', teluguName: 'వేదాద్రి', distanceKm: 36, approxTravelTime: '54 min' }
            ]
          },
          {
            name: 'Kanchikacherla',
            teluguName: 'కంచికచర్ల',
            distanceFromBranchKm: 14,
            villages: [
              { name: 'Kanchikacherla', teluguName: 'కంచికచర్ల', distanceKm: 14, approxTravelTime: '20 min' },
              { name: 'Batavaram', teluguName: 'బటవరం', distanceKm: 17, approxTravelTime: '26 min' },
              { name: 'Chevitikallu', teluguName: 'చెవిటికల్లు', distanceKm: 19, approxTravelTime: '30 min' },
              { name: 'Gani Atkuru', teluguName: 'గాని ఆత్కూరు', distanceKm: 22, approxTravelTime: '35 min' },
              { name: 'Gottumukkala', teluguName: 'గొట్టుముక్కల', distanceKm: 18, approxTravelTime: '28 min' },
              { name: 'Keesara', teluguName: 'కీసర', distanceKm: 11, approxTravelTime: '16 min' },
              { name: 'Kunikenapadu', teluguName: 'కునికెనపాడు', distanceKm: 16, approxTravelTime: '25 min' },
              { name: 'Moguluru', teluguName: 'మొగులూరు', distanceKm: 13, approxTravelTime: '20 min' },
              { name: 'Munnaluru', teluguName: 'మున్నలూరు', distanceKm: 21, approxTravelTime: '33 min' },
              { name: 'Paritala', teluguName: 'పరిటాల', distanceKm: 20, approxTravelTime: '32 min' },
              { name: 'Pendyal', teluguName: 'పెండ్యాల', distanceKm: 16, approxTravelTime: '24 min' },
              { name: 'Perakalapadu', teluguName: 'పేరకలపాడు', distanceKm: 15, approxTravelTime: '22 min' },
              { name: 'Senagapadu', teluguName: 'సెనగపాడు', distanceKm: 18, approxTravelTime: '28 min' },
              { name: 'Vemulapalli', teluguName: 'వేములపల్లి', distanceKm: 23, approxTravelTime: '36 min' }
            ]
          },
          {
            name: 'Penuganchiprolu',
            teluguName: 'పెనుగంచిప్రోలు',
            distanceFromBranchKm: 19,
            villages: [
              { name: 'Penuganchiprolu', teluguName: 'పెనుగంచిప్రోలు', distanceKm: 19, approxTravelTime: '30 min' },
              { name: 'Anigandlapadu', teluguName: 'అనిగండ్లపాడు', distanceKm: 22, approxTravelTime: '35 min' },
              { name: 'Gopinenipalem', teluguName: 'గోపినేనిపాలెం', distanceKm: 24, approxTravelTime: '38 min' },
              { name: 'Gumpadlapadu', teluguName: 'గుంపడ్లపాడు', distanceKm: 21, approxTravelTime: '34 min' },
              { name: 'Kolluru', teluguName: 'కొల్లూరు', distanceKm: 25, approxTravelTime: '40 min' },
              { name: 'Konakanchi', teluguName: 'కోనకంచి', distanceKm: 16, approxTravelTime: '25 min' },
              { name: 'Lingaala', teluguName: 'లింగాల', distanceKm: 23, approxTravelTime: '36 min' },
              { name: 'Mundlapadu', teluguName: 'ముండ్లపాడు', distanceKm: 20, approxTravelTime: '32 min' },
              { name: 'Sanagapadu', teluguName: 'సనగపాడు', distanceKm: 26, approxTravelTime: '42 min' },
              { name: 'Thotacharla', teluguName: 'తోటచర్ల', distanceKm: 18, approxTravelTime: '28 min' },
              { name: 'Venkateswarapuram', teluguName: 'వెంకటేశ్వరపురం', distanceKm: 27, approxTravelTime: '44 min' }
            ]
          },
          {
            name: 'Vatsavai',
            teluguName: 'వత్సవాయి',
            distanceFromBranchKm: 30,
            villages: [
              { name: 'Vatsavai', teluguName: 'వత్సవాయి', distanceKm: 30, approxTravelTime: '45 min' },
              { name: 'Allurupadu', teluguName: 'అల్లూరుపాడు', distanceKm: 32, approxTravelTime: '48 min' },
              { name: 'Bhimavaram', teluguName: 'భీమవరం', distanceKm: 35, approxTravelTime: '52 min' },
              { name: 'Chityala', teluguName: 'చిత్యాల', distanceKm: 28, approxTravelTime: '42 min' },
              { name: 'Dabbakupalli', teluguName: 'దబ్బకుపల్లి', distanceKm: 33, approxTravelTime: '50 min' },
              { name: 'Gopavaram', teluguName: 'గోపవరం', distanceKm: 34, approxTravelTime: '51 min' },
              { name: 'Kakarla', teluguName: 'కాకర్ల', distanceKm: 36, approxTravelTime: '54 min' },
              { name: 'Kambhampadu', teluguName: 'కంభంపాడు', distanceKm: 27, approxTravelTime: '40 min' },
              { name: 'Makkapeta', teluguName: 'మక్కపేట', distanceKm: 31, approxTravelTime: '46 min' },
              { name: 'Maredumilli', teluguName: 'మారెడుమిల్లి', distanceKm: 37, approxTravelTime: '56 min' },
              { name: 'Pedamodugapalle', teluguName: 'పెద్దమోదుగపల్లె', distanceKm: 29, approxTravelTime: '43 min' },
              { name: 'Pochampalli', teluguName: 'పోచంపల్లి', distanceKm: 38, approxTravelTime: '58 min' },
              { name: 'Talluru', teluguName: 'తాళ్లూరు', distanceKm: 26, approxTravelTime: '38 min' }
            ]
          },
          {
            name: 'Veerullapadu',
            teluguName: 'వీరుళ్లపాడు',
            distanceFromBranchKm: 22,
            villages: [
              { name: 'Veerullapadu', teluguName: 'వీరుళ్లపాడు', distanceKm: 22, approxTravelTime: '35 min' },
              { name: 'Alluru', teluguName: 'అల్లూరు', distanceKm: 25, approxTravelTime: '40 min' },
              { name: 'Bodavada', teluguName: 'బోడవడ', distanceKm: 26, approxTravelTime: '42 min' },
              { name: 'Chatrannapadu', teluguName: 'చత్రన్నపాడు', distanceKm: 20, approxTravelTime: '32 min' },
              { name: 'Chintalapadu', teluguName: 'చింతలపాడు', distanceKm: 24, approxTravelTime: '38 min' },
              { name: 'Dodleru', teluguName: 'దొడ్లేరు', distanceKm: 28, approxTravelTime: '45 min' },
              { name: 'Gokarajupalli', teluguName: 'గోకరాజుపల్లి', distanceKm: 21, approxTravelTime: '34 min' },
              { name: 'Jaggannapeta', teluguName: 'జగ్గన్నపేట', distanceKm: 23, approxTravelTime: '37 min' },
              { name: 'Jujjuru', teluguName: 'జుజ్జూరు', distanceKm: 19, approxTravelTime: '30 min' },
              { name: 'Kannevandlapalem', teluguName: 'కన్నెవండ్లపాలెం', distanceKm: 27, approxTravelTime: '44 min' },
              { name: 'Narasimharaopalem', teluguName: 'నరసింహారావుపాలెం', distanceKm: 18, approxTravelTime: '28 min' },
              { name: 'Peddapuram', teluguName: 'పెద్దాపురం', distanceKm: 29, approxTravelTime: '46 min' },
              { name: 'Thimmapuram', teluguName: 'తిమ్మాపురం', distanceKm: 25, approxTravelTime: '40 min' },
              { name: 'Vellanki', teluguName: 'వెల్లంకి', distanceKm: 20, approxTravelTime: '33 min' }
            ]
          },
          {
            name: 'Ibrahimpatnam',
            teluguName: 'ఇబ్రహీంపట్నం',
            distanceFromBranchKm: 32,
            villages: [
              { name: 'Ibrahimpatnam', teluguName: 'ఇబ్రహీంపట్నం', distanceKm: 32, approxTravelTime: '40 min' },
              { name: 'Damuluru', teluguName: 'దాములూరు', distanceKm: 35, approxTravelTime: '45 min' },
              { name: 'Guntupalli', teluguName: 'గుంటుపల్లి', distanceKm: 34, approxTravelTime: '43 min' },
              { name: 'Kachavaram', teluguName: 'కాచవరం', distanceKm: 37, approxTravelTime: '48 min' },
              { name: 'Ketanakonda', teluguName: 'కేతనకొండ', distanceKm: 30, approxTravelTime: '38 min' },
              { name: 'Kondapalli', teluguName: 'కొండపల్లి', distanceKm: 33, approxTravelTime: '42 min' },
              { name: 'Kotikalapudi', teluguName: 'కోటికలపూడి', distanceKm: 36, approxTravelTime: '46 min' },
              { name: 'Mulapadu', teluguName: 'ములపాడు', distanceKm: 31, approxTravelTime: '39 min' },
              { name: 'Trilochanapuram', teluguName: 'త్రిలోచనపురం', distanceKm: 38, approxTravelTime: '50 min' },
              { name: 'Tummalapalem', teluguName: 'తుమ్మలపాలెం', distanceKm: 29, approxTravelTime: '37 min' },
              { name: 'Zeedimarla', teluguName: 'జీడిమర్ల', distanceKm: 39, approxTravelTime: '52 min' }
            ]
          },
          {
            name: 'Kankipadu',
            teluguName: 'కంకిపాడు',
            distanceFromBranchKm: 48,
            villages: [
              { name: 'Kankipadu', teluguName: 'కంకిపాడు', distanceKm: 48, approxTravelTime: '65 min' },
              { name: 'Chalivendrapalem', teluguName: 'చలివేంద్రపాలెం', distanceKm: 50, approxTravelTime: '68 min' },
              { name: 'Davuluru', teluguName: 'దావులూరు', distanceKm: 52, approxTravelTime: '70 min' },
              { name: 'Godavarru', teluguName: 'గోదావర్రు', distanceKm: 46, approxTravelTime: '62 min' },
              { name: 'Kolanukonda', teluguName: 'కొలనుకొండ', distanceKm: 45, approxTravelTime: '60 min' },
              { name: 'Konathanapadu', teluguName: 'కోనతనపాడు', distanceKm: 47, approxTravelTime: '64 min' },
              { name: 'Kunderu', teluguName: 'కుందేరు', distanceKm: 51, approxTravelTime: '69 min' },
              { name: 'Madduru', teluguName: 'మద్దూరు', distanceKm: 49, approxTravelTime: '66 min' },
              { name: 'Neppalle', teluguName: 'నెప్పల్లె', distanceKm: 53, approxTravelTime: '72 min' },
              { name: 'Prodduturu', teluguName: 'ప్రొద్దుటూరు', distanceKm: 44, approxTravelTime: '59 min' },
              { name: 'Punadipadu', teluguName: 'పునాదిపాడు', distanceKm: 47, approxTravelTime: '63 min' },
              { name: 'Uppaluru', teluguName: 'ఉప్పలూరు', distanceKm: 50, approxTravelTime: '67 min' }
            ]
          }
        ]
      }
    ]
  },
  '4732': {
    code: '4732',
    name: 'Sri Gayathri Automotives - 4732 Hub',
    teluguName: 'శ్రీ గాయత్రి ఆటోమోటివ్స్ - 4732 కోడ్',
    allMandals: [
      'Gudivada',
      'Gudlavalleru',
      'Nandivada',
      'Mudinepalli',
      'Pamarru',
      'Pedaparupudi',
      'Vijayawada Rural',
      'Penamaluru',
      'Kankipadu',
      'Gannavaram',
      'Ibrahimpatnam',
      'Vuyyuru',
      'Thotlavalluru',
      'Machilipatnam',
      'Pedana',
      'Bantumilli',
      'Kruthivennu',
      'Movva',
      'Ghantasala',
      'Challapalli',
      'Avanigadda',
      'Nagayalanka',
      'Koduru'
    ],
    branches: [
      {
        id: 'gudiwada',
        name: 'Gudivada',
        teluguName: 'గుడివాడ',
        dealershipCode: '4732',
        hubAddress: 'Eluru Road / Bypass Junction, Gudivada, Krishna District',
        phone: '9848045678',
        mandals: [
          {
            name: 'Gudivada',
            teluguName: 'గుడివాడ',
            distanceFromBranchKm: 0,
            villages: [
              { name: 'Gudivada Town', teluguName: 'గుడివాడ టౌన్', distanceKm: 0, approxTravelTime: '0 min' },
              { name: 'Billapadu', teluguName: 'బిళ్ళపాడు', distanceKm: 4, approxTravelTime: '8 min' },
              { name: 'Bommuluru', teluguName: 'బొమ్ములూరు', distanceKm: 7, approxTravelTime: '14 min' },
              { name: 'Chilakamudi', teluguName: 'చిలకముడి', distanceKm: 5, approxTravelTime: '10 min' },
              { name: 'Chowtapalli', teluguName: 'చౌటపల్లి', distanceKm: 8, approxTravelTime: '16 min' },
              { name: 'Dongaravipalem', teluguName: 'దొంగరావిపాలెం', distanceKm: 6, approxTravelTime: '12 min' },
              { name: 'Gangadharapuram', teluguName: 'గంగాధరపురం', distanceKm: 9, approxTravelTime: '18 min' },
              { name: 'Mallayapalem', teluguName: 'మల్లాయపాలెం', distanceKm: 5, approxTravelTime: '10 min' },
              { name: 'Mandapadu', teluguName: 'మండపాడు', distanceKm: 7, approxTravelTime: '15 min' },
              { name: 'Moturu', teluguName: 'మోటూరు', distanceKm: 8, approxTravelTime: '16 min' },
              { name: 'Nagavarappadu', teluguName: 'నాగవరప్పాడు', distanceKm: 11, approxTravelTime: '22 min' },
              { name: 'Pedayerukapadu', teluguName: 'పెద్దఎరుకపాడు', distanceKm: 3, approxTravelTime: '6 min' },
              { name: 'Ramanapudi', teluguName: 'రమణపూడి', distanceKm: 10, approxTravelTime: '20 min' },
              { name: 'Sayapuram', teluguName: 'సాయాపురం', distanceKm: 6, approxTravelTime: '12 min' },
              { name: 'Seridaggumilli', teluguName: 'సేరిదగ్గుమిల్లి', distanceKm: 12, approxTravelTime: '24 min' },
              { name: 'Valivarthipadu', teluguName: 'వలివర్తిపాడు', distanceKm: 4, approxTravelTime: '8 min' }
            ]
          },
          {
            name: 'Gudlavalleru',
            teluguName: 'గుడ్లవల్లేరు',
            distanceFromBranchKm: 12,
            villages: [
              { name: 'Gudlavalleru', teluguName: 'గుడ్లవల్లేరు', distanceKm: 12, approxTravelTime: '20 min' },
              { name: 'Angaluru', teluguName: 'అంగలూరు', distanceKm: 8, approxTravelTime: '14 min' },
              { name: 'Chandrala', teluguName: 'చంద్రాల', distanceKm: 15, approxTravelTime: '25 min' },
              { name: 'Chitram', teluguName: 'చిత్రం', distanceKm: 16, approxTravelTime: '26 min' },
              { name: 'Dokiparru', teluguName: 'దోకిపర్రు', distanceKm: 14, approxTravelTime: '22 min' },
              { name: 'Gadepudi', teluguName: 'గాడేపూడి', distanceKm: 17, approxTravelTime: '28 min' },
              { name: 'Kowtharam', teluguName: 'కౌతవరం', distanceKm: 13, approxTravelTime: '21 min' },
              { name: 'Kurada', teluguName: 'కురడ', distanceKm: 18, approxTravelTime: '30 min' },
              { name: 'Mamillapalli', teluguName: 'మామిళ్లపల్లి', distanceKm: 11, approxTravelTime: '18 min' },
              { name: 'Nagavaram', teluguName: 'నాగవరం', distanceKm: 16, approxTravelTime: '27 min' },
              { name: 'Penjendra', teluguName: 'పెంజెండ్ర', distanceKm: 19, approxTravelTime: '32 min' },
              { name: 'Serikalvapudi', teluguName: 'సేరికల్వపూడి', distanceKm: 15, approxTravelTime: '24 min' },
              { name: 'Vadlamannadu', teluguName: 'వడ్లమన్నాడు', distanceKm: 14, approxTravelTime: '23 min' },
              { name: 'Vemaraju Khandrika', teluguName: 'వేమరాజు ఖండ్రిక', distanceKm: 20, approxTravelTime: '34 min' }
            ]
          },
          {
            name: 'Nandivada',
            teluguName: 'నందివాడ',
            distanceFromBranchKm: 10,
            villages: [
              { name: 'Nandivada', teluguName: 'నందివాడ', distanceKm: 10, approxTravelTime: '18 min' },
              { name: 'Annavaram', teluguName: 'అన్నవరం', distanceKm: 13, approxTravelTime: '22 min' },
              { name: 'Aripirala', teluguName: 'అరిపిరాల', distanceKm: 8, approxTravelTime: '14 min' },
              { name: 'Chedurtipadu', teluguName: 'చేదుర్తిపాడు', distanceKm: 12, approxTravelTime: '20 min' },
              { name: 'Ilaparru', teluguName: 'ఇలపర్రు', distanceKm: 9, approxTravelTime: '15 min' },
              { name: 'Janardhanapuram', teluguName: 'జనార్ధనపురం', distanceKm: 14, approxTravelTime: '24 min' },
              { name: 'Kuderu', teluguName: 'కుదేరు', distanceKm: 11, approxTravelTime: '19 min' },
              { name: 'Nandivada Agraharam', teluguName: 'నందివాడ అగ్రహారం', distanceKm: 10, approxTravelTime: '18 min' },
              { name: 'Oddulameraka', teluguName: 'ఒద్దులమెరక', distanceKm: 15, approxTravelTime: '26 min' },
              { name: 'Pedalingala', teluguName: 'పెద్దలింగాల', distanceKm: 12, approxTravelTime: '21 min' },
              { name: 'Polukonda', teluguName: 'పోలుకొండ', distanceKm: 16, approxTravelTime: '28 min' },
              { name: 'Ramapuram', teluguName: 'రామాపురం', distanceKm: 7, approxTravelTime: '12 min' },
              { name: 'Rudrapaka', teluguName: 'రుద్రపాక', distanceKm: 14, approxTravelTime: '25 min' },
              { name: 'Tummalacheruvu', teluguName: 'తుమ్మలచెరువు', distanceKm: 17, approxTravelTime: '30 min' }
            ]
          },
          {
            name: 'Mudinepalli',
            teluguName: 'ముదినేపల్లి',
            distanceFromBranchKm: 16,
            villages: [
              { name: 'Mudinepalli', teluguName: 'ముదినేపల్లి', distanceKm: 16, approxTravelTime: '26 min' },
              { name: 'Alluru', teluguName: 'అల్లూరు', distanceKm: 20, approxTravelTime: '32 min' },
              { name: 'Chigurukota', teluguName: 'చిగురుకోట', distanceKm: 18, approxTravelTime: '30 min' },
              { name: 'Dakaram', teluguName: 'దకారం', distanceKm: 22, approxTravelTime: '35 min' },
              { name: 'Devarapalli', teluguName: 'దేవరపల్లి', distanceKm: 15, approxTravelTime: '24 min' },
              { name: 'Guraza', teluguName: 'గురజ', distanceKm: 14, approxTravelTime: '22 min' },
              { name: 'Koduru', teluguName: 'కోడూరు', distanceKm: 19, approxTravelTime: '31 min' },
              { name: 'Moparla', teluguName: 'మోపర్ల', distanceKm: 21, approxTravelTime: '34 min' },
              { name: 'Pedatunidi', teluguName: 'పెద్దతునిది', distanceKm: 23, approxTravelTime: '38 min' },
              { name: 'Peruru', teluguName: 'పేరూరు', distanceKm: 17, approxTravelTime: '28 min' },
              { name: 'Singarayapalem', teluguName: 'సింగరాయపాలెం', distanceKm: 24, approxTravelTime: '40 min' },
              { name: 'Vadali', teluguName: 'వడలి', distanceKm: 13, approxTravelTime: '20 min' },
              { name: 'Vangipuram', teluguName: 'వంగీపురం', distanceKm: 25, approxTravelTime: '42 min' }
            ]
          },
          {
            name: 'Pamarru',
            teluguName: 'పామర్రు',
            distanceFromBranchKm: 15,
            villages: [
              { name: 'Pamarru Town', teluguName: 'పామర్రు టౌన్', distanceKm: 15, approxTravelTime: '22 min' },
              { name: 'Addada', teluguName: 'అద్దడ', distanceKm: 18, approxTravelTime: '28 min' },
              { name: 'Balliparru', teluguName: 'బల్లిపర్రు', distanceKm: 13, approxTravelTime: '20 min' },
              { name: 'Canumolu', teluguName: 'చానుమోలు', distanceKm: 17, approxTravelTime: '26 min' },
              { name: 'Jammidintakurru', teluguName: 'జమ్మిదింతకుర్రు', distanceKm: 20, approxTravelTime: '32 min' },
              { name: 'Komaravolu', teluguName: 'కొమరవోలు', distanceKm: 19, approxTravelTime: '30 min' },
              { name: 'Kurumaddali', teluguName: 'కురుమద్దాలి', distanceKm: 14, approxTravelTime: '21 min' },
              { name: 'Nimmaluru', teluguName: 'నిమ్మలూరు', distanceKm: 16, approxTravelTime: '25 min' },
              { name: 'Pasumarru', teluguName: 'పసుమర్రు', distanceKm: 21, approxTravelTime: '33 min' },
              { name: 'Pedamaddali', teluguName: 'పెద్దమద్దాలి', distanceKm: 12, approxTravelTime: '18 min' },
              { name: 'Polavaram', teluguName: 'పోలవరం', distanceKm: 22, approxTravelTime: '35 min' },
              { name: 'Rimmanapudi', teluguName: 'రిమ్మనపూడి', distanceKm: 18, approxTravelTime: '29 min' },
              { name: 'Uruturu', teluguName: 'ఉరుటూరు', distanceKm: 23, approxTravelTime: '36 min' },
              { name: 'Zillellamudi', teluguName: 'జిల్లెళ్లమూడి', distanceKm: 15, approxTravelTime: '24 min' }
            ]
          },
          {
            name: 'Pedaparupudi',
            teluguName: 'పెదపారుపూడి',
            distanceFromBranchKm: 14,
            villages: [
              { name: 'Pedaparupudi', teluguName: 'పెదపారుపూడి', distanceKm: 14, approxTravelTime: '22 min' },
              { name: 'Appikatla', teluguName: 'అప్పికట్ల', distanceKm: 17, approxTravelTime: '28 min' },
              { name: 'Chinaparupudi', teluguName: 'చినపారుపూడి', distanceKm: 13, approxTravelTime: '20 min' },
              { name: 'Duvva', teluguName: 'దువ్వ', distanceKm: 16, approxTravelTime: '26 min' },
              { name: 'Elamarru', teluguName: 'ఎలమర్రు', distanceKm: 18, approxTravelTime: '29 min' },
              { name: 'Gurivindagunta', teluguName: 'గురివిందగుంట', distanceKm: 19, approxTravelTime: '31 min' },
              { name: 'Juvvalapalem', teluguName: 'జువ్వలపాలెం', distanceKm: 20, approxTravelTime: '33 min' },
              { name: 'Kavutavaram', teluguName: 'కావుతవరం', distanceKm: 12, approxTravelTime: '18 min' },
              { name: 'Maheswarapuram', teluguName: 'మహేశ్వరపురం', distanceKm: 15, approxTravelTime: '24 min' },
              { name: 'Pamidimukkala', teluguName: 'పామిడిముక్కల', distanceKm: 21, approxTravelTime: '35 min' },
              { name: 'Ravipadu', teluguName: 'రావిపాడు', distanceKm: 16, approxTravelTime: '25 min' },
              { name: 'Somavarappadu', teluguName: 'సోమవరప్పాడు', distanceKm: 18, approxTravelTime: '29 min' },
              { name: 'Ventrapragada', teluguName: 'వెంట్రప్రగడ', distanceKm: 11, approxTravelTime: '16 min' },
              { name: 'Yelamarru', teluguName: 'యలమర్రు', distanceKm: 17, approxTravelTime: '27 min' }
            ]
          }
        ]
      },
      {
        id: 'poranki_vijayawada',
        name: 'Poranki - Vijayawada',
        teluguName: 'పోరంకి - విజయవాడ',
        dealershipCode: '4732',
        hubAddress: 'Bandar Road / Auto Nagar / Poranki Main Road, Vijayawada, Krishna/NTR Dist',
        phone: '9848056789',
        mandals: [
          {
            name: 'Penamaluru',
            teluguName: 'పెనమలూరు',
            distanceFromBranchKm: 2,
            villages: [
              { name: 'Poranki', teluguName: 'పోరంకి', distanceKm: 0, approxTravelTime: '0 min' },
              { name: 'Penamaluru', teluguName: 'పెనమలూరు', distanceKm: 3, approxTravelTime: '6 min' },
              { name: 'Auto Nagar', teluguName: 'ఆటో నగర్', distanceKm: 4, approxTravelTime: '8 min' },
              { name: 'Chodavaram', teluguName: 'చోడవరం', distanceKm: 6, approxTravelTime: '12 min' },
              { name: 'Ganguru', teluguName: 'గంగూరు', distanceKm: 5, approxTravelTime: '10 min' },
              { name: 'Gosala', teluguName: 'గోసాల', distanceKm: 7, approxTravelTime: '14 min' },
              { name: 'Kanuru', teluguName: 'కానూరు', distanceKm: 3, approxTravelTime: '6 min' },
              { name: 'Pedapulipaka', teluguName: 'పెద్దపులిపాక', distanceKm: 6, approxTravelTime: '12 min' },
              { name: 'Sanath Nagar', teluguName: 'సనత్ నగర్', distanceKm: 4, approxTravelTime: '8 min' },
              { name: 'Tadigadapa', teluguName: 'తాడిగడప', distanceKm: 2, approxTravelTime: '4 min' },
              { name: 'Vanukuru', teluguName: 'వానుకురు', distanceKm: 8, approxTravelTime: '16 min' },
              { name: 'Yanamalakuduru', teluguName: 'యనమలకుదురు', distanceKm: 5, approxTravelTime: '10 min' }
            ]
          },
          {
            name: 'Vijayawada Rural',
            teluguName: 'విజయవాడ రూరల్',
            distanceFromBranchKm: 8,
            villages: [
              { name: 'Enikepadu', teluguName: 'ఎనికేపాడు', distanceKm: 6, approxTravelTime: '12 min' },
              { name: 'Gollapudi', teluguName: 'గొల్లపూడి', distanceKm: 15, approxTravelTime: '28 min' },
              { name: 'Gudavalli', teluguName: 'గూడవల్లి', distanceKm: 9, approxTravelTime: '18 min' },
              { name: 'Jakkampudi', teluguName: 'జక్కంపూడి', distanceKm: 18, approxTravelTime: '34 min' },
              { name: 'Kandrika', teluguName: 'కండ్రిక', distanceKm: 12, approxTravelTime: '24 min' },
              { name: 'Kotturu', teluguName: 'కొత్తూరు', distanceKm: 14, approxTravelTime: '26 min' },
              { name: 'Nunna', teluguName: 'నూన్న', distanceKm: 11, approxTravelTime: '20 min' },
              { name: 'Paidurupadu', teluguName: 'పైదురుపాడు', distanceKm: 13, approxTravelTime: '25 min' },
              { name: 'Pathapadu', teluguName: 'పాతపాడు', distanceKm: 14, approxTravelTime: '27 min' },
              { name: 'Prasadampadu', teluguName: 'ప్రసాదంపాడు', distanceKm: 5, approxTravelTime: '10 min' },
              { name: 'Ramavarappadu', teluguName: 'రామవరప్పాడు', distanceKm: 6, approxTravelTime: '12 min' },
              { name: 'Rayapudi', teluguName: 'రాయపూడి', distanceKm: 16, approxTravelTime: '30 min' },
              { name: 'Surampalli', teluguName: 'సూరంపల్లి', distanceKm: 17, approxTravelTime: '32 min' },
              { name: 'Vemavaram', teluguName: 'వేమవరం', distanceKm: 10, approxTravelTime: '20 min' }
            ]
          },
          {
            name: 'Vuyyuru',
            teluguName: 'వుయ్యూరు',
            distanceFromBranchKm: 18,
            villages: [
              { name: 'Vuyyuru Town', teluguName: 'వుయ్యూరు టౌన్', distanceKm: 18, approxTravelTime: '25 min' },
              { name: 'Akunuru', teluguName: 'ఆకునూరు', distanceKm: 21, approxTravelTime: '30 min' },
              { name: 'Bollapadu', teluguName: 'బొల్లపాడు', distanceKm: 23, approxTravelTime: '34 min' },
              { name: 'Chinaogirala', teluguName: 'చినఓగిరాల', distanceKm: 20, approxTravelTime: '28 min' },
              { name: 'Garikaparru', teluguName: 'గరికపర్రు', distanceKm: 22, approxTravelTime: '32 min' },
              { name: 'Gurazada', teluguName: 'గురజాడ', distanceKm: 19, approxTravelTime: '27 min' },
              { name: 'Jabarlapudi', teluguName: 'జబర్లపూడి', distanceKm: 24, approxTravelTime: '36 min' },
              { name: 'Kadurupadu', teluguName: 'కదురుపాడు', distanceKm: 25, approxTravelTime: '38 min' },
              { name: 'Katuru', teluguName: 'కాటూరు', distanceKm: 16, approxTravelTime: '24 min' },
              { name: 'Madduru', teluguName: 'మద్దూరు', distanceKm: 17, approxTravelTime: '25 min' },
              { name: 'Manthada', teluguName: 'మంతడ', distanceKm: 22, approxTravelTime: '33 min' },
              { name: 'Mudunuru', teluguName: 'ముదునూరు', distanceKm: 26, approxTravelTime: '40 min' },
              { name: 'Peddaogirala', teluguName: 'పెద్దఓగిరాల', distanceKm: 21, approxTravelTime: '31 min' },
              { name: 'Sayapuram', teluguName: 'సాయాపురం', distanceKm: 19, approxTravelTime: '28 min' },
              { name: 'Veeravalli', teluguName: 'వీరవల్లి', distanceKm: 27, approxTravelTime: '42 min' }
            ]
          },
          {
            name: 'Thotlavalluru',
            teluguName: 'తోట్లవల్లూరు',
            distanceFromBranchKm: 24,
            villages: [
              { name: 'Thotlavalluru', teluguName: 'తోట్లవల్లూరు', distanceKm: 24, approxTravelTime: '36 min' },
              { name: 'Chagantipadu', teluguName: 'చాగంటిపాడు', distanceKm: 26, approxTravelTime: '40 min' },
              { name: 'China Pulipaka', teluguName: 'చిన పులిపాక', distanceKm: 21, approxTravelTime: '32 min' },
              { name: 'Devarapalli', teluguName: 'దేవరపల్లి', distanceKm: 25, approxTravelTime: '38 min' },
              { name: 'Garikaparru', teluguName: 'గరికపర్రు', distanceKm: 28, approxTravelTime: '43 min' },
              { name: 'Iluru', teluguName: 'ఇలూరు', distanceKm: 22, approxTravelTime: '34 min' },
              { name: 'Kanumuru', teluguName: 'కానుమూరు', distanceKm: 27, approxTravelTime: '42 min' },
              { name: 'Kusumuru', teluguName: 'కుసుమూరు', distanceKm: 29, approxTravelTime: '45 min' },
              { name: 'Madhavarappadu', teluguName: 'మాధవరప్పాడు', distanceKm: 23, approxTravelTime: '35 min' },
              { name: 'North Valluru', teluguName: 'నార్త్ వల్లూరు', distanceKm: 24, approxTravelTime: '37 min' },
              { name: 'Pandillapalli', teluguName: 'పందిళ్లపల్లి', distanceKm: 30, approxTravelTime: '48 min' },
              { name: 'Royyuru', teluguName: 'రొయ్యూరు', distanceKm: 20, approxTravelTime: '30 min' },
              { name: 'South Valluru', teluguName: 'సౌత్ వల్లూరు', distanceKm: 25, approxTravelTime: '39 min' }
            ]
          }
        ]
      },
      {
        id: 'machilipatnam_21',
        name: 'Machilipatnam - 21',
        teluguName: 'మచిలీపట్నం - 21',
        dealershipCode: '4732',
        hubAddress: 'Bypass Highway / Chilakalapudi / Paraspet, Machilipatnam, Krishna District',
        phone: '9848067890',
        mandals: [
          {
            name: 'Machilipatnam',
            teluguName: 'మచిలీపట్నం',
            distanceFromBranchKm: 0,
            villages: [
              { name: 'Machilipatnam Town', teluguName: 'మచిలీపట్నం టౌన్', distanceKm: 0, approxTravelTime: '0 min' },
              { name: 'Bandar Kota', teluguName: 'బందరు కోట', distanceKm: 3, approxTravelTime: '6 min' },
              { name: 'Borrapothupalem', teluguName: 'బొర్రాపోతుపాలెం', distanceKm: 7, approxTravelTime: '14 min' },
              { name: 'Buddalapalem', teluguName: 'బుద్దాలపాలెం', distanceKm: 8, approxTravelTime: '16 min' },
              { name: 'Chilakalapudi', teluguName: 'చిలకలపూడి', distanceKm: 4, approxTravelTime: '8 min' },
              { name: 'Gokavaram', teluguName: 'గోకవరం', distanceKm: 9, approxTravelTime: '18 min' },
              { name: 'Kara Agraharam', teluguName: 'కారా అగ్రహారం', distanceKm: 6, approxTravelTime: '12 min' },
              { name: 'Kona', teluguName: 'కోన', distanceKm: 11, approxTravelTime: '22 min' },
              { name: 'Manginapudi', teluguName: 'మంగినపూడి', distanceKm: 12, approxTravelTime: '20 min' },
              { name: 'Nelakurru', teluguName: 'నేలకుర్రు', distanceKm: 8, approxTravelTime: '15 min' },
              { name: 'Paraspet', teluguName: 'పరాస్‌పేట', distanceKm: 2, approxTravelTime: '4 min' },
              { name: 'Pedayadara', teluguName: 'పెద్దయాదర', distanceKm: 10, approxTravelTime: '20 min' },
              { name: 'Polatitippa', teluguName: 'పోలాటితిప్ప', distanceKm: 14, approxTravelTime: '26 min' },
              { name: 'Potlapalem', teluguName: 'పొట్లపాలెం', distanceKm: 5, approxTravelTime: '10 min' },
              { name: 'Sultanagaram', teluguName: 'సుల్తానగరం', distanceKm: 6, approxTravelTime: '12 min' },
              { name: 'Tallapalem', teluguName: 'తాళ్లపాలెం', distanceKm: 9, approxTravelTime: '18 min' }
            ]
          },
          {
            name: 'Pedana',
            teluguName: 'పెడన',
            distanceFromBranchKm: 12,
            villages: [
              { name: 'Pedana Town', teluguName: 'పెడన టౌన్', distanceKm: 12, approxTravelTime: '18 min' },
              { name: 'Balliparru', teluguName: 'బల్లిపర్రు', distanceKm: 15, approxTravelTime: '24 min' },
              { name: 'Chebrolu', teluguName: 'చేబ్రోలు', distanceKm: 18, approxTravelTime: '28 min' },
              { name: 'Chennuru', teluguName: 'చెన్నూరు', distanceKm: 10, approxTravelTime: '16 min' },
              { name: 'Guraza', teluguName: 'గురజ', distanceKm: 14, approxTravelTime: '22 min' },
              { name: 'Kakamani', teluguName: 'కాకమాని', distanceKm: 17, approxTravelTime: '26 min' },
              { name: 'Kavipuram', teluguName: 'కవిపురం', distanceKm: 19, approxTravelTime: '30 min' },
              { name: 'Konkepudi', teluguName: 'కొంకేపూడి', distanceKm: 13, approxTravelTime: '20 min' },
              { name: 'Kopparru', teluguName: 'కొప్పర్రు', distanceKm: 16, approxTravelTime: '25 min' },
              { name: 'Kuduru', teluguName: 'కుదురు', distanceKm: 11, approxTravelTime: '18 min' },
              { name: 'Madaka', teluguName: 'మడక', distanceKm: 20, approxTravelTime: '32 min' },
              { name: 'Nandigama', teluguName: 'నందిగామ', distanceKm: 15, approxTravelTime: '23 min' },
              { name: 'Nelakurru', teluguName: 'నేలకుర్రు', distanceKm: 14, approxTravelTime: '22 min' },
              { name: 'Penjendra', teluguName: 'పెంజెండ్ర', distanceKm: 21, approxTravelTime: '34 min' }
            ]
          },
          {
            name: 'Bantumilli',
            teluguName: 'బంటుమిల్లి',
            distanceFromBranchKm: 28,
            villages: [
              { name: 'Bantumilli', teluguName: 'బంటుమిల్లి', distanceKm: 28, approxTravelTime: '40 min' },
              { name: 'Arthamuru', teluguName: 'అర్థమూరు', distanceKm: 32, approxTravelTime: '46 min' },
              { name: 'Barrepadu', teluguName: 'బర్రెపాడు', distanceKm: 30, approxTravelTime: '44 min' },
              { name: 'Chanda', teluguName: 'చంద', distanceKm: 26, approxTravelTime: '38 min' },
              { name: 'Chilukuru', teluguName: 'చిలుకూరు', distanceKm: 31, approxTravelTime: '45 min' },
              { name: 'Gollamudi', teluguName: 'గొల్లమూడి', distanceKm: 29, approxTravelTime: '42 min' },
              { name: 'Koramilli', teluguName: 'కోరమిల్లి', distanceKm: 34, approxTravelTime: '50 min' },
              { name: 'Mallampudi', teluguName: 'మల్లంపూడి', distanceKm: 27, approxTravelTime: '39 min' },
              { name: 'Manepalli', teluguName: 'మానేపల్లి', distanceKm: 33, approxTravelTime: '48 min' },
              { name: 'Mulaparru', teluguName: 'ములపర్రు', distanceKm: 35, approxTravelTime: '52 min' },
              { name: 'Pedamajjipudi', teluguName: 'పెద్దమజ్జిపూడి', distanceKm: 25, approxTravelTime: '36 min' },
              { name: 'Penduru', teluguName: 'పెండూరు', distanceKm: 30, approxTravelTime: '44 min' },
              { name: 'Satuluru', teluguName: 'సాతులూరు', distanceKm: 36, approxTravelTime: '54 min' }
            ]
          },
          {
            name: 'Kruthivennu',
            teluguName: 'కృతివెన్ను',
            distanceFromBranchKm: 36,
            villages: [
              { name: 'Kruthivennu', teluguName: 'కృతివెన్ను', distanceKm: 36, approxTravelTime: '50 min' },
              { name: 'Chinna Gollapalem', teluguName: 'చిన్న గొల్లపాలెం', distanceKm: 42, approxTravelTime: '58 min' },
              { name: 'Chinna Pandriga', teluguName: 'చిన్న పాండ్రిగ', distanceKm: 38, approxTravelTime: '53 min' },
              { name: 'Endakuduru', teluguName: 'ఎండకుదురు', distanceKm: 34, approxTravelTime: '48 min' },
              { name: 'Gariselemudi', teluguName: 'గరిసెలమూడి', distanceKm: 39, approxTravelTime: '54 min' },
              { name: 'Interu', teluguName: 'ఇంటేరు', distanceKm: 35, approxTravelTime: '49 min' },
              { name: 'Komallapudi', teluguName: 'కోమళ్లపూడి', distanceKm: 37, approxTravelTime: '52 min' },
              { name: 'Laxmipuram', teluguName: 'లక్ష్మీపురం', distanceKm: 40, approxTravelTime: '55 min' },
              { name: 'Matlam', teluguName: 'మట్లం', distanceKm: 43, approxTravelTime: '60 min' },
              { name: 'Munjuluru', teluguName: 'ముంజులూరు', distanceKm: 33, approxTravelTime: '46 min' },
              { name: 'Neelipudi', teluguName: 'నీలిపూడి', distanceKm: 41, approxTravelTime: '57 min' },
              { name: 'Pedagollapalem', teluguName: 'పెద్దగొల్లపాలెం', distanceKm: 44, approxTravelTime: '62 min' },
              { name: 'Tadicherla', teluguName: 'తాడిచెర్ల', distanceKm: 38, approxTravelTime: '53 min' }
            ]
          },
          {
            name: 'Movva',
            teluguName: 'మొవ్వ',
            distanceFromBranchKm: 24,
            villages: [
              { name: 'Movva', teluguName: 'మొవ్వ', distanceKm: 24, approxTravelTime: '35 min' },
              { name: 'Aviripudi', teluguName: 'అవిరిపూడి', distanceKm: 27, approxTravelTime: '40 min' },
              { name: 'Bhatlapenumarru', teluguName: 'భట్లపెనుమర్రు', distanceKm: 22, approxTravelTime: '32 min' },
              { name: 'Chinavutapalli', teluguName: 'చినవుటపల్లి', distanceKm: 26, approxTravelTime: '38 min' },
              { name: 'Gudapadu', teluguName: 'గూడపాడు', distanceKm: 28, approxTravelTime: '42 min' },
              { name: 'Kaza', teluguName: 'కాజ', distanceKm: 20, approxTravelTime: '30 min' },
              { name: 'Kosuru', teluguName: 'కోసూరు', distanceKm: 25, approxTravelTime: '36 min' },
              { name: 'Kuchipudi', teluguName: 'కూచిపూడి', distanceKm: 21, approxTravelTime: '31 min' },
              { name: 'Mantripalem', teluguName: 'మంత్రిపాలెం', distanceKm: 29, approxTravelTime: '44 min' },
              { name: 'Mopidevi', teluguName: 'మోపిదేవి', distanceKm: 30, approxTravelTime: '45 min' },
              { name: 'Movvapalem', teluguName: 'మొవ్వపాలెం', distanceKm: 23, approxTravelTime: '34 min' },
              { name: 'Nidubrolu', teluguName: 'నిడుబ్రోలు', distanceKm: 31, approxTravelTime: '46 min' },
              { name: 'Pedamuttevi', teluguName: 'పెద్దముత్తేవి', distanceKm: 26, approxTravelTime: '38 min' },
              { name: 'Pedasanagallu', teluguName: 'పెద్దసనగల్లు', distanceKm: 27, approxTravelTime: '39 min' },
              { name: 'Sivarampuram', teluguName: 'శివరాంపురం', distanceKm: 32, approxTravelTime: '48 min' }
            ]
          },
          {
            name: 'Ghantasala',
            teluguName: 'ఘంటసాల',
            distanceFromBranchKm: 26,
            villages: [
              { name: 'Ghantasala', teluguName: 'ఘంటసాల', distanceKm: 26, approxTravelTime: '38 min' },
              { name: 'Birudugadda', teluguName: 'బిరుదుగడ్డ', distanceKm: 29, approxTravelTime: '42 min' },
              { name: 'Chitturpu', teluguName: 'చిత్తూరుపు', distanceKm: 24, approxTravelTime: '35 min' },
              { name: 'Devarapalli', teluguName: 'దేవరపల్లి', distanceKm: 28, approxTravelTime: '41 min' },
              { name: 'Gollapalem', teluguName: 'గొల్లపాలెం', distanceKm: 25, approxTravelTime: '36 min' },
              { name: 'Koduru', teluguName: 'కోడూరు', distanceKm: 30, approxTravelTime: '45 min' },
              { name: 'Lankapalli', teluguName: 'లంకపల్లి', distanceKm: 27, approxTravelTime: '40 min' },
              { name: 'Mallampalli', teluguName: 'మల్లంపల్లి', distanceKm: 31, approxTravelTime: '46 min' },
              { name: 'Pushadam', teluguName: 'పుషదం', distanceKm: 32, approxTravelTime: '48 min' },
              { name: 'Srikakulam', teluguName: 'శ్రీకాకుళం', distanceKm: 33, approxTravelTime: '50 min' },
              { name: 'Tadepalli', teluguName: 'తాడేపల్లి', distanceKm: 23, approxTravelTime: '34 min' },
              { name: 'Vemulapalli', teluguName: 'వేములపల్లి', distanceKm: 28, approxTravelTime: '42 min' }
            ]
          },
          {
            name: 'Challapalli',
            teluguName: 'చల్లపల్లి',
            distanceFromBranchKm: 25,
            villages: [
              { name: 'Challapalli Town', teluguName: 'చల్లపల్లి టౌన్', distanceKm: 25, approxTravelTime: '36 min' },
              { name: 'Chitigudur', teluguName: 'చితిగూడూరు', distanceKm: 28, approxTravelTime: '40 min' },
              { name: 'Daliparru', teluguName: 'దాలిపర్రు', distanceKm: 29, approxTravelTime: '42 min' },
              { name: 'Lakshmipuram', teluguName: 'లక్ష్మీపురం', distanceKm: 23, approxTravelTime: '34 min' },
              { name: 'Majeedpalem', teluguName: 'మజీద్‌పాలెం', distanceKm: 26, approxTravelTime: '38 min' },
              { name: 'Mangalapuram', teluguName: 'మంగళాపురం', distanceKm: 30, approxTravelTime: '44 min' },
              { name: 'Nadimpalem', teluguName: 'నడింపాలెం', distanceKm: 27, approxTravelTime: '39 min' },
              { name: 'Nandigama', teluguName: 'నందిగామ', distanceKm: 31, approxTravelTime: '45 min' },
              { name: 'Pagolu', teluguName: 'పాగోలు', distanceKm: 24, approxTravelTime: '35 min' },
              { name: 'Puritigadda', teluguName: 'పురిటిగడ్డ', distanceKm: 27, approxTravelTime: '40 min' },
              { name: 'Velivolu', teluguName: 'వెలివోలు', distanceKm: 22, approxTravelTime: '32 min' },
              { name: 'Yarlagadda', teluguName: 'యార్లగడ్డ', distanceKm: 28, approxTravelTime: '41 min' }
            ]
          },
          {
            name: 'Avanigadda',
            teluguName: 'అవనిగడ్డ',
            distanceFromBranchKm: 35,
            villages: [
              { name: 'Avanigadda Town', teluguName: 'అవనిగడ్డ టౌన్', distanceKm: 35, approxTravelTime: '48 min' },
              { name: 'Aswaraopalem', teluguName: 'అశ్వారావుపాలెం', distanceKm: 38, approxTravelTime: '52 min' },
              { name: 'Chirivolu', teluguName: 'చిరివోలు', distanceKm: 33, approxTravelTime: '45 min' },
              { name: 'Edurumondi', teluguName: 'ఎదురుమొండి', distanceKm: 42, approxTravelTime: '58 min' },
              { name: 'Modumudi', teluguName: 'మోదుమూడి', distanceKm: 36, approxTravelTime: '50 min' },
              { name: 'Nagalayalanka Cross', teluguName: 'నాగయలంక క్రాస్', distanceKm: 39, approxTravelTime: '54 min' },
              { name: 'Puligadda', teluguName: 'పులిగడ్డ', distanceKm: 32, approxTravelTime: '44 min' },
              { name: 'Ramanagaram', teluguName: 'రామనగరం', distanceKm: 37, approxTravelTime: '51 min' },
              { name: 'South Chirivolu', teluguName: 'సౌత్ చిరివోలు', distanceKm: 34, approxTravelTime: '46 min' },
              { name: 'Vekanuru', teluguName: 'వేకనూరు', distanceKm: 40, approxTravelTime: '56 min' }
            ]
          },
          {
            name: 'Nagayalanka',
            teluguName: 'నాగాయలంక',
            distanceFromBranchKm: 42,
            villages: [
              { name: 'Nagayalanka', teluguName: 'నాగాయలంక', distanceKm: 42, approxTravelTime: '58 min' },
              { name: 'Bhavadevarapalli', teluguName: 'భవదేవరపల్లి', distanceKm: 39, approxTravelTime: '54 min' },
              { name: 'Choragudi', teluguName: 'చోరగుడి', distanceKm: 44, approxTravelTime: '60 min' },
              { name: 'Edurumondi', teluguName: 'ఎదురుమొండి', distanceKm: 48, approxTravelTime: '68 min' },
              { name: 'Ganapeswaram', teluguName: 'గణపేశ్వరం', distanceKm: 45, approxTravelTime: '62 min' },
              { name: 'Kamalapuram', teluguName: 'కమలాపురం', distanceKm: 41, approxTravelTime: '56 min' },
              { name: 'Marripalem', teluguName: 'మర్రిపాలెం', distanceKm: 43, approxTravelTime: '59 min' },
              { name: 'Nangegadda', teluguName: 'నంగేగడ్డ', distanceKm: 46, approxTravelTime: '64 min' },
              { name: 'Parachivara', teluguName: 'పరచివర', distanceKm: 47, approxTravelTime: '66 min' },
              { name: 'Sorlagondi', teluguName: 'సొర్లగొండి', distanceKm: 50, approxTravelTime: '72 min' },
              { name: 'Talakadadivi', teluguName: 'తలకడదివి', distanceKm: 49, approxTravelTime: '70 min' }
            ]
          },
          {
            name: 'Koduru',
            teluguName: 'కోడూరు',
            distanceFromBranchKm: 45,
            villages: [
              { name: 'Koduru', teluguName: 'కోడూరు', distanceKm: 45, approxTravelTime: '62 min' },
              { name: 'Hamaladivi', teluguName: 'హమలదివి', distanceKm: 48, approxTravelTime: '66 min' },
              { name: 'Jayapuram', teluguName: 'జయపురం', distanceKm: 43, approxTravelTime: '59 min' },
              { name: 'Lingareddypalem', teluguName: 'లింగారెడ్డిపాలెం', distanceKm: 46, approxTravelTime: '64 min' },
              { name: 'Machavaram', teluguName: 'మచ్ఛవరం', distanceKm: 44, approxTravelTime: '60 min' },
              { name: 'Mandapakala', teluguName: 'మండపాకల', distanceKm: 49, approxTravelTime: '68 min' },
              { name: 'Nali', teluguName: 'నాలి', distanceKm: 47, approxTravelTime: '65 min' },
              { name: 'Pittalalanka', teluguName: 'పిట్టలలంక', distanceKm: 51, approxTravelTime: '72 min' },
              { name: 'Ramakrishnapuram', teluguName: 'రామకృష్ణాపురం', distanceKm: 42, approxTravelTime: '57 min' },
              { name: 'Salempalem', teluguName: 'సాలెంపాలెం', distanceKm: 50, approxTravelTime: '70 min' },
              { name: 'Srinivasapuram', teluguName: 'శ్రీనివాసపురం', distanceKm: 46, approxTravelTime: '63 min' },
              { name: 'Ullipalem', teluguName: 'ఉల్లిపాలెం', distanceKm: 52, approxTravelTime: '75 min' }
            ]
          }
        ]
      }
    ]
  }
};

// Normalized string comparison helper
export function normalizeGeoStr(str: any): string {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Generate Google Maps Directions URL from Branch Hub to Village
export function getGoogleMapsDirectionsUrl(branchName: string, villageName: string, mandalName?: string): string {
  const origin = encodeURIComponent(`${branchName} Eicher Tractors Workshop Andhra Pradesh`);
  const destination = encodeURIComponent(`${villageName} ${mandalName || ''} Krishna NTR Andhra Pradesh`);
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
}

// Generate Google Maps Search URL for a specific village/location
export function getGoogleMapsSearchUrl(villageName: string, mandalName?: string): string {
  const query = encodeURIComponent(`${villageName} ${mandalName || ''} Andhra Pradesh India`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
