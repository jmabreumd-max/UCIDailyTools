export interface DrugInfo {
  name: string;
  category: string;
  dose: string;
  renal: string;
  hepatic: string;
  rrt: string;
  albumin: string;
  notes: string;
}

export const DRUGS_DATA: DrugInfo[] = [
  // Anti-hipertensores
  {
    name: "Labetalol",
    category: "Cardio",
    dose: "Bolus 10-20mg. Perfusão 1 a 8 mg/min (0.5 a 8 mg/h).",
    renal: "Sem ajuste.",
    hepatic: "Reduzida perfusão em falência grave.",
    rrt: "Não dialisável.",
    albumin: "Moderada ligação.",
    notes: "Eficaz em emergência hipertensiva (alfa1 e beta bloqueador não-seletivo)."
  },
  {
    name: "Urapidilo",
    category: "Cardio",
    dose: "Bolus 10-50mg. Perfusão 9-30 mg/h",
    renal: "Seguro sem ajuste.",
    hepatic: "Reduzir dose até 50% em hepatopatia.",
    rrt: "Monitorizar.",
    albumin: "Não aplicável.",
    notes: "Antagonista α1 periférico. Excelente eficácia e segurança."
  },
  {
    name: "Metildopa",
    category: "Cardio",
    dose: "250-500 mg 8/8h PO/IV",
    renal: "Aumentar intervalo na IR.",
    hepatic: "Uso com precaução, hepatotóxico (hepatite fulminante rara).",
    rrt: "Dialisável (15-20%).",
    albumin: "Não relevante.",
    notes: "Uso comum na gravidez (pré-eclâmpsia)."
  },
  {
    name: "Lisinopril",
    category: "Cardio",
    dose: "5-40 mg 24/24h PO",
    renal: "Excreção renal. Ajustar na IR severa. Pode piorar a LRA na fase hiperaguda.",
    hepatic: "Sem ajuste.",
    rrt: "Dialisável.",
    albumin: "Não relevante",
    notes: "IECA. Monitorizar creatinina e potássio."
  },

  // Vasodilatadores / Neurológicos
  {
    name: "Nimodipina",
    category: "Neuro",
    dose: "1-2 mg/h Perfusão IV contínua ou 60mg 4/4h via oral",
    renal: "Sem ajuste.",
    hepatic: "Metabolismo muito elevado (CYP3A4), reduzir a dose em compromisso hepático.",
    rrt: "Não dialisável.",
    albumin: "Sem impacto.",
    notes: "Prevenção de vasoespasmo na Hemorragia Subaracnoídea."
  },

  // Osmoterapia
  {
    name: "Manitol a 20%",
    category: "Neuro",
    dose: "0.5 a 1.0 g/kg (bolus rápido 20-30 min)",
    renal: "CI em anúria sem RRT. Pode paradoxalmente causar LRA por necrose tubular se dose >200g/d.",
    hepatic: "Sem impacto.",
    rrt: "Facilmente dialisável (pode arrastar líquidos perigosamente no circuito se rápido).",
    albumin: "Não aplicável.",
    notes: "Cria gap osmolar. Cristais ocorrem <20ºC (aquecer p/ redissolver). Retoma natriurese."
  },

  // Anti-convulsivantes / Gabaérgicos
  {
    name: "Fenitoína",
    category: "Neuro",
    dose: "Ataque: 15-20 mg/kg IV (máx 50 mg/min). Manutenção: 5 mg/kg/dia.",
    renal: "Em uremia profunda há ↓ afinidade da albumina (monitorizar free-phenytoin).",
    hepatic: "Metabolismo extenso. Dose diminuída em insuficiência hepática.",
    rrt: "Não dialisável de forma significativa.",
    albumin: "Altamente ligada (~90%). Hipoalbuminemia = mais fração livre (tóxica) p/ mesmo nível total.",
    notes: "Risco bradicardia/hipotensão em bólus rápido IV."
  },
  {
    name: "Ácido Valpróico (Valproato)",
    category: "Neuro",
    dose: "Ataque: 20-40 mg/kg IV. Manutenção: 10-15 mg/kg 8/8h.",
    renal: "Aumento fração livre na uremia.",
    hepatic: "Gera hepatotoxicidade potencial. Uso cauteloso.",
    rrt: "Não removível por RRT.",
    albumin: "Liga-se muito. Hipoalbuminemia: risco aumentado na toxidade.",
    notes: "Trombocitopenia e hiperamonémia como efeitos nefastos possíveis."
  },
  {
    name: "Levetiracetam",
    category: "Neuro",
    dose: "Ataque 15-20 mg/kg IV. Manutenção: 500-1500 mg 12/12h.",
    renal: "Excretado imutável. Exige ajuste estrito se ClCr diminuído.",
    hepatic: "Sem necessidade ajuste.",
    rrt: "Extensamente removido! Dar bolus extra após diálise.",
    albumin: "Irrelevante (<10%).",
    notes: "Menor incidência de interações medicamentosas. Pode causar irritabilidade."
  },
  {
    name: "Perampanel",
    category: "Neuro",
    dose: "2 a 12 mg 24/24h PO (não há IV).",
    renal: "Evitar em LRA grave.",
    hepatic: "Evitar ou ajustar dose leve/moderada.",
    rrt: "Desconhecido a sua clearance mas tem alta ligação proteica.",
    albumin: "Afinidade de 95%.",
    notes: "Antagonista receptor AMPA. Efeito adverso psiquiátrico comum (agressividade)."
  },

  // Antipsicóticos e SNC
  {
    name: "Haloperidol (Haldol)",
    category: "Neuro",
    dose: "0.5 a 5 mg IV/IM SOS (ou perfusão raramente)",
    renal: "Sem ajuste primário.",
    hepatic: "Evitar em hepatopatia aguda (CYP3A4/2D6).",
    rrt: "Não dialisável.",
    albumin: "Moderada. Irrelevante.",
    notes: "Tratamento de delirium hiperativo. Causa prolongamento do intervalo QTc."
  },
  {
    name: "Quetiapina",
    category: "Neuro",
    dose: "12.5 a 50 mg 12/12h PO (escalar se necessário)",
    renal: "Sem necessidade.",
    hepatic: "Reduzir dose.",
    rrt: "Não avaliado (não IV).",
    albumin: "Altamente ligada (~83%).",
    notes: "Útil no desmame de ventilador/delirium noturno. Altera QTc."
  },
  {
    name: "Olanzapina",
    category: "Neuro",
    dose: "2.5 a 10 mg 24/24h PO ou IM.",
    renal: "Sem dados precisos, parece seguro.",
    hepatic: "Metabolismo extenso por glucoronidação e P450.",
    rrt: "Não removido em diálise.",
    albumin: "Irrelevante.",
    notes: "Sintomas extrapiramidais e aumento ponderal crónico."
  },
  {
    name: "Sertralina",
    category: "Neuro",
    dose: "50-200 mg 24/24h PO",
    renal: "Pouco afetada.",
    hepatic: "Muito metabólizado, usar ½ dose na IH.",
    rrt: "Mínimo impacto.",
    albumin: "Mínimo.",
    notes: "Inibidor da recaptação de Serotonina (SSRI). Risco de síndrome serotoninérgico se misturado com tramadol, MAOI, etc."
  },
  {
    name: "Gabapentina",
    category: "Neuro",
    dose: "100-300 mg até 8/8h PO",
    renal: "Excreção puramente renal. Redução de dose OBRIGATÓRIA na IR.",
    hepatic: "Sem Ajuste (não é metabolizado aqui).",
    rrt: "Extensamente removido por HDCI/CVVH.",
    albumin: "Não se liga a proteínas.",
    notes: "Dor neuropática. Causa muita sonolência."
  },

  // Sedação e Analgesia (e Adjuvantes)
  {
    name: "Propofol a 1% e 2%",
    category: "Neuro",
    dose: "Indução: 1-2 mg/kg. Perfusão: 0.5-4 mg/kg/h.",
    renal: "Sem ajuste.",
    hepatic: "Ligeiramente reduzido na doença hepática avançada mas clearance global excede débito hepático devido a met extra-hepatico.",
    rrt: "Não dialisável.",
    albumin: "Sem impacto grave, altamente lipofílico.",
    notes: "Carga lipídica: o de 2% tem metade do volume lipídico e reduz incidência de hipertrigliceridemia p/ a mesma dose."
  },
  {
    name: "Midazolam",
    category: "Neuro",
    dose: "Bolus: 0.05-0.1 mg/kg. Perfusão: 0.02-0.1 mg/kg/h.",
    renal: "Acumulação de metabolito alfa-hidroximidazolam na LRA (prolonga gravemente sedação).",
    hepatic: "Metabolismo hepático extenso. Afetado nas hepatopatias.",
    rrt: "Não dialisadas grandes proporções nativas, mas RRT remove o metabolito parcialmente.",
    albumin: "Altamente ligada, fração livre aumenta no stress.",
    notes: "Potencial amnésico. Mais deliriogénico do que Propofol e Dexmedetomidina."
  },
  {
    name: "Cetamina",
    category: "Neuro",
    dose: "Bolus: 1-2 mg/kg. Sub-dissoc/Analgesia co-adjuvante: 0.1-0.3 mg/kg/h",
    renal: "Seguro. Metabólito ativo (norcetamina) pode acumular em pequenas quantidades.",
    hepatic: "CYP3A4, cuidado em IH reduzindo dose inicial.",
    rrt: "Apenas removido em CVVHDF lentamente. Clínicamente dar dose normal.",
    albumin: "Indiferente.",
    notes: "Estimula sistema simpático (mantem de TA). Broncodilatador ótimo na asma. ↑ Secreções."
  },
  {
    name: "Tiopental",
    category: "Neuro",
    dose: "Rápida: 3-5 mg/kg IV. Coma barbitúrico: infulsão perfícua 2-4 mg/kg/h.",
    renal: "Sensível. Não necessita ajuste de dose mas pacientes urémicos sofrem anestesia mais profunda.",
    hepatic: "Metabolismo lento. Meia-vida prolongada (11h).",
    rrt: "Não.",
    albumin: "Na uremia = menor ligação à albumina (~reduz 50%).",
    notes: "Depressor cardíaco severo. Vasodilatação intensa."
  },

  // Opióides e Analgésicos Não Opióides
  {
    name: "Fentanil",
    category: "Neuro",
    dose: "Bolus: 1-3 mcg/kg. Perfusão: 0.5-3 mcg/kg/h",
    renal: "Sem interações ou ajustes drásticos, pouco afetado por LRA em short-term.",
    hepatic: "Metabolismo extenso por CYP3A4, evitar se hepático severo ou titular cuidadosamente.",
    rrt: "Pouca remoção nas membranas por se colar no material sintético do filtro.",
    albumin: "Alto T1/2 de contexto-sensível (=acúmulo com perfusões > 48h no tecido adiposo).",
    notes: "Pode induzir rigidez da parede torácica em bolus rápido potente."
  },
  {
    name: "Remifentanil",
    category: "Neuro",
    dose: "0.05 a 0.25 mcg/kg/min",
    renal: "Não carece de NENHUM ajuste.",
    hepatic: "Esterases sanguíneas inespecíficas, não impactado pelas funções dos orgãos.",
    rrt: "Não dialisa.",
    albumin: "Irrelevante.",
    notes: "Ultra-rápido, sem efeito residual de washout. Risco de hiperalgesia opióide aos despertares."
  },
  {
    name: "Morfina",
    category: "Neuro",
    dose: "2-10 mg IV bolus.",
    renal: "M-6-G acumula em doentes insuficientes crónicos provocando depressão respiratória duradoura MAU.",
    hepatic: "Afectada tardiamente mas o pior efeito é renal.",
    rrt: "M-6-G é removida nas diálises.",
    albumin: "Proteína livre elevada.",
    notes: "Vasodilatação por libertação histamínica."
  },
  {
    name: "Tramadol",
    category: "Neuro",
    dose: "50-100 mg 8/8h IV/PO",
    renal: "Aumentar intervalo de tomas. ClCr <30 = máximo 200mg/dia.",
    hepatic: "Metabólito ativo, atrasado no cirrótico.",
    rrt: "Eliminada na diálise.",
    albumin: "Cerca 20% ligada.",
    notes: "Age no recetor µ, inibição da receptação Serotonina/Noradrenalina. Evitar se epilepsia."
  },
  {
    name: "Petidina",
    category: "Neuro",
    dose: "50-100 mg IM SOS (Pouco usado IV)",
    renal: "Acumulação de norpetidina (tóxica a nível neuroexcitatório - convulsõs).",
    hepatic: "Requer ajuste.",
    rrt: "Norpetidina é dialisável em 25%.",
    albumin: "Sem impacto drástico.",
    notes: "Opióide associado a tremores e convulsões. Tratamento empírico de calafrios pós-anestesia."
  },
  {
    name: "Metamizol (Nolotil)",
    category: "Neuro",
    dose: "1-2g 8/8h a 6/6h IV (perfusão rápida/lenta de 20min).",
    renal: "Metabolitos renais ativos (evitar no ClCr < 30 ou altas doses).",
    hepatic: "Pode provocar hepatite imunoalérgica rara mas não carece de ajuste profilático primário.",
    rrt: "Não há indicação clara para restrição extra.",
    albumin: "Ligação 40-60%.",
    notes: "Inibição prostaglandinas, efeito vasodilatador rápido! Hipotensão comum quando administrada de uma só vez (bólus). Risco de Agranulocitose."
  },
  {
    name: "Paracetamol",
    category: "Analgésicos / Antipiréticos",
    dose: "1g 8/8h ou 6/6h IV/PO (máx 4g/dia)",
    renal: "ClCr < 30 = intervalo para cada 6h ou 8h de 500mg (máximo 2 a 3g dia).",
    hepatic: "Reduzir em doentes com insuficiência (hepatite fulminante) para 2-3g.",
    rrt: "Perda mínima, repor em RRT só se ultra-filtração altíssima.",
    albumin: "Mínima.",
    notes: "Antipirético de 1.ª linha via COX-3 e canais TRPA1 no SNC. Causa hipotensão intermédia IV (agente colóide o manitol que tem associado no frasco endovenoso)."
  },
  {
    name: "Cetorolac",
    category: "Neuro",
    dose: "30mg IV SOS (máx 90mg/dia) - Evitar uso por + de 5 dias.",
    renal: "Exigência rigorosa <15mg se LRA severa ou contraindicado absoluto. Extrema toxicidade nas artérias renais do DOENTE CRITICO e Idoso.",
    hepatic: "Não requer redução significativa de dose imediata.",
    rrt: "Nefrotóxico.",
    albumin: "Alta afinidade com competição. (ex> varfarina)",
    notes: "Excelente para a dor pós-aguda operatória cirúrgica (AINE potente)."
  },

  // Aminas e Inotrópicos / Vasoactivos
  {
    name: "Adrenalina",
    category: "Cardio",
    dose: "Bolus na paragem 1mg C/ 3 a 5 min. Perfusão 0.01-0.5 mcg/kg/min",
    renal: "Fluxo renal pode reduzir.",
    hepatic: "Catecol-o-metiltransferase faz clivagem rápida.",
    rrt: "Irrelevante.",
    albumin: "Irrelevante.",
    notes: "Induz hiperglicemia e lactatemia na fase precoce."
  },
  {
    name: "Noradrenalina",
    category: "Cardio",
    dose: "0.05 a 1.0 (raro>2) mcg/kg/min.",
    renal: "Pode melhorar o DC mas reduz perfusão micro da arteríola do nefrónio.",
    hepatic: "O mesmo que adrenalina.",
    rrt: "Irrelevante.",
    albumin: "Irrelevante.",
    notes: "Alfa-1 (90%) e Beta-1 (10%). Choque séptico 1.ª linha."
  },
  {
    name: "Dobutamina",
    category: "Cardio",
    dose: "2.5 a 20 mcg/kg/min.",
    renal: "Atua Beta-1 primário. (Inotrópico, cronotrópico).",
    hepatic: "Mesmo que as aminas.",
    rrt: "Irrelevante.",
    albumin: "Irrelevante.",
    notes: "Pode causar vasoplegia/hipotensão arrastada sistémica. Exige euvolemia antes do início."
  },
  {
    name: "Dopamina",
    category: "Cardio",
    dose: "2-5 (dose delta), 5-10 (beta), 10-20 (alfa) mcg/kg/min.",
    renal: "Doses baixas 'renais' já não recomendadas.",
    hepatic: "Excreções renais dependentes.",
    rrt: "Irrelevante.",
    albumin: "Irrelevante.",
    notes: "Atualmente em desuso, suprimido pela Noradrenalina face às evidências de taquicardia mortais."
  },
  {
    name: "Fenilefrina",
    category: "Cardio",
    dose: "Bolus 50-100 mcg. Perfusão: 0.5-5 mcg/kg/min.",
    renal: "Ação Alfa-1 pura! Vasoconstrição.",
    hepatic: "Metabolismo MAO hepático.",
    rrt: "Irrelevante.",
    albumin: "Irrelevante.",
    notes: "Risco de bradicardia compensatória grave. Essencial em indução anestésica vasoplégica."
  },
  {
    name: "Efedrina",
    category: "Cardio",
    dose: "Bolus IV: 5-10 mg SOS.",
    renal: "Seguro. Acão indireta nas bolsas sinápticas (Liberta NE).",
    hepatic: "Segura com a sua T1/2 ~3h.",
    rrt: "Irrelevante.",
    albumin: "Irrelevante.",
    notes: "Inotropismo mais Cronotropismo + alfa-vasopressor. Excelente intraoperatório prolongado."
  },

  // Antiarrítmicos e RCP
  {
    name: "Amiodarona",
    category: "Cardio",
    dose: "RCP: 300mg followed 150mg. Estável: ataque 150mg 10min -> Perfusão 900mg 24h.",
    renal: "Não necessita ajuste para Insuficiência Renal. Ausência na urina nativa.",
    hepatic: "Cuidado pois metabolismo por CYP3A4 com tempo de semi-vida de > 50 dias e acumulação em gorduras e pulmão.",
    rrt: "Não tem perda de fármaco na RRT.",
    albumin: "Alta ligação lipidoproteica (96%).",
    notes: "Toxidade pulmonar (fibrose aguda em uso de O2 elevada?), tiroideia (iodo intra) e hipotensão por polisorbato em injecções rápidas."
  },
  {
    name: "Lidocaína",
    category: "Cardio",
    dose: "RCP: 1-1.5 mg/kg IV. Estável: 1-4 mg/min.",
    renal: "Metabólitos tóxicos podem se acumular em disfunção grave IR.",
    hepatic: "Diminuir a Dose substancialmente na Insuficiência Hepática crassa e Choque com baixo Débito hepático.",
    rrt: "Removida RRT minimamente.",
    albumin: "Afinidade das glicoproteinas-ácidas α-1 (aumentadas no stress).",
    notes: "Sintomas neuronais precoces na toxidade: formigueiro perioral."
  },
  {
    name: "Adenosina",
    category: "Cardio",
    dose: "Rápido bolus grande acesso proximal CVC de 6mg e 12mg (x2).",
    renal: "Destruída na rede hemática capilar em <10 segundos na parede do plasma e eritrócitos.",
    hepatic: "Pelo curto espaço de tempo, orgãos não limitam a droga.",
    rrt: "Não dialisado no tempo.",
    albumin: "Absolutamente indissociável na semi-vida.",
    notes: "Bradicardiante para reverter SVT (reentrada nodal AV). O doente sente 'sensação de morte por paragem'."
  },
  {
    name: "Atropina",
    category: "Cardio",
    dose: "0.5 a 1.0 mg Bólus IV (RCP bradicárdica: máx ~3mg num adulto humano).",
    renal: "50% libertada puramente por urinas.",
    hepatic: "Hidrolise nos tecidos.",
    rrt: "Dialisado parcialmente, não necessita cuidados extra por single doses.",
    albumin: "Ligação 18%.",
    notes: "Antagonista Muscarínico puro colinérgico para controlo SNAS predominante num nó."
  },

  // Diuréticos
  {
    name: "Furosemida",
    category: "Renal",
    dose: "Bolus 20-80mg (até 500+ na LRA grave). Perfusões até 20 mg/h.",
    renal: "Curva teto diurético. Necessidade de aumentos de dose pesados em doença crónica.",
    hepatic: "Efeito adverso potencial devido aos distúrbios electrolíticos.",
    rrt: "Não extraível.",
    albumin: "Forte ligação proteica (+95%), necessita entrar pelo túbulo proximal.",
    notes: "Diurético da Ansa. Hipo K, Hipo Na, Ototoxicidade (doses grandes e bolus rápidos)."
  },
  {
    name: "Metolazona (Metalazona)",
    category: "Renal",
    dose: "2.5 - 5 mg (até max 10mg) PO/enterala diárias.",
    renal: "Trabalham no túbulo distal como tipo-tiazídico. Efeito drástico mesmo se GFR < 20mL/min ao contrário dos tiazídicos nativos.",
    hepatic: "PODE dar em patologia hepática, atenção a alcalose e desiquilíbrios.",
    rrt: "Irrelevante na dialítica.",
    albumin: "Altamente ligado proteicamente (não passa gromérulo).",
    notes: "Em conjunção com a furosemida, gera bloqueio tubular duplo sequencial fortíssimo (administrar oral 30min ANTES)."
  },

  // Inversores Neuromusculares e Outros
  {
    name: "Biperideno",
    category: "Neuro",
    dose: "2 a 5 mg IV lento.",
    renal: "Sem dados que reportem falência da taxa de excressão perigosa.",
    hepatic: "Hígado executa oxidações metabólicas da droga sintética.",
    rrt: "Irrelevante numa urgência aguda.",
    albumin: "Sem informação clínica crucial.",
    notes: "Anticolinérgico para inverter sintomas Extrapiramidais agudos de uso de haldol, plasil..."
  },
  {
    name: "Neostigmina",
    category: "Neuro",
    dose: "Max adulto: ~5mg (0.05 mg/kg IV) c/ atropina p/ cada fração p/ reverter Rocurónio/Atracúrio sem sugamadex disponíveis.",
    renal: "IR arrasta depuração.",
    hepatic: "Irrelevante metabolismo hepático.",
    rrt: "Não se deve atrasar, pode se administrar normalmente a dose calculada.",
    albumin: "Ligação irrelevante 15-25%.",
    notes: "Sempre co-administrar atropina/glicopirrolato antes!"
  },

  // Anti-Infeciosos extra
  {
    name: "Cefepime",
    category: "Infeção",
    dose: "1 - 2g de 8/8h até 12/12h",
    renal: "Obrigatório o Ajuste Criterioso <50 ClCr para afastar convulsões mioclónicas (neurotoxicidade letal do cefepime).",
    hepatic: "Apenas não atua neste órgão.",
    rrt: "Eliminada com força em HD, exige reposicionamento das tomas.",
    albumin: "20% ligações de proteína, logo livre e biodisponível.",
    notes: "Excelente atuação antipseudomonal de Cefalosporina 4.ª"
  },
  {
    name: "Ceftazidima-Avibactam (Zavicefta)",
    category: "Infeção",
    dose: "2.5 g (2g/0.5g) IV cada 8h sob perfusão de 2h.",
    renal: "Ajustar fortemente abaixo dos 50mL/min para evitar toxicidade e falhas de alvos T>MIC.",
    hepatic: "Não se metaboliza a nível do fígado.",
    rrt: "Técnicas de RRT exigem readministração da perfusão dependendo do ultra-filtro.",
    albumin: "Cerca de 10%.",
    notes: "Inibição e lise de bactérias beta-lactamase espectro alargado e Klebsiella pneumoniae Carbapenemase-resistant (KPC)."
  },
  {
    name: "Ceftolozano-Tazobactam (Zerbaxa)",
    category: "Infeção",
    dose: "1.5g a 3g IV cada 8h sob perfusões de 1h.",
    renal: "Como em todas as misturas novas com inibidores Beta-Lact., tem ajuste severo. (1.5g nas PNEU vs 3g empíricas Pseudomonas altas).",
    hepatic: "Sem regulação.",
    rrt: "Cuidado redobrado nas RRT contínuas.",
    albumin: "Abaixo de 25%.",
    notes: "Ação ultra eficaz nas estirpes P.aeruginosa MDR."
  },
  {
    name: "Aztreonam",
    category: "Infeção",
    dose: "1 a 2g de 8/8h IV ou Perfusões Extensas.",
    renal: "Ajuste por clearance glomerular diminuta.",
    hepatic: "Depreende pouco.",
    rrt: "Substituição e depuração presente.",
    albumin: "50-60%.",
    notes: "Sem acção sobre Gram+ nem anaeróbios, apenas sobre Gram- aeróbicas estritas. (Monobactamo) Alternativa segura as alergias à penincilina."
  },
  {
    name: "Cotrimoxazol (Trimetoprim/Sulfametoxazol)",
    category: "Infeção",
    dose: "Dose depende do TMP (15-20mg/kg/dia 6/6h) PCP/Pneumocystis",
    renal: "Requer ajuste renal < 30mL/minuto para metade.",
    hepatic: "Problemas raros mas potenciais.",
    rrt: "TMP depura totalmente em HD pós-HD reativar doses.",
    albumin: "Sulfametoxazol: alta ligação e pode deslocar varfarina com consequências.",
    notes: "Hipercaliemia é o principal limite fatal de administração do Cotrimoxazol."
  },
  {
    name: "Eritromicina (Pró-Cinético)",
    category: "Digestivo",
    dose: "200-250mg IV por 20minutos 6h a 8h/8h como pró-cinético perante stasis e resíduos altos gástricos. (Toma de 3-5 dias).",
    renal: "Baixo cuidado de reordenação.",
    hepatic: "Maioritariamente hepático o seu depuramento por fel e biliar.",
    rrt: "Sem dados.",
    albumin: "Forte aderência.",
    notes: "Motilina ligante, efeito agonista gerando contração antral brutal."
  },
  {
    name: "Insulina Regular / Rápida",
    category: "Renal",
    dose: "Bolus (0.1 U/kg) e Perfusões à medida e à escala: ex. 0.05 - 0.1 U/kg/h nas cetoacidoses.",
    renal: "Insulina é degradada pelo rim!! Falência aguda ou crónica reduz subitamente a dose de insulina pois ela entra numa acumulação que vai para o leito sistémico, precipitando graves hipoglicémias a longos tempos. (Ajustar com cuidado a baixo na admissão e doente com AKI - Acute kidney Ingury)",
    hepatic: "Também a degrada de forma massiva.",
    rrt: "Irrelevante e até depurada pela própria absorção do tubo de PVC/Poliuretano. Na diálise as bolsas de glicose e a ausência da excreção renal promovem hipoglicémias se não regular.",
    albumin: "Não acoplada.",
    notes: "A infusão é habitualmente misturada 50 U em 50mL NaCl a 0.9% (logo 1U/mL)."
  }

  , {
    name: "Linezolida",
    category: "Infeção",
    dose: "600mg 12/12h IV ou PO",
    renal: "Sem necessidade de ajuste sistemático.",
    hepatic: "Uso com extrema precaução na cirrose grave.",
    rrt: "Não removido por HD em quantias vitais, não ajustar.",
    albumin: "31% ligada. Indiferente.",
    notes: "Risco de trombocitopenia após uso prolongado (>10 dias) e neuropatia. Monitorizar plaquetas."
  },
  {
    name: "Amicacina",
    category: "Infeção",
    dose: "15 mg/kg 24/24h IV (dose dependendo de picos).",
    renal: "MUITO NEFROTÓXICA. Ajuste de intervalo imperativo de acordo com clearance e nível sérico.",
    hepatic: "Sem Ajuste.",
    rrt: "Apenas removida lentamente por RRT contínua. Suplementar dose após a diálise intermitente.",
    albumin: "Baixa ligação proteica.",
    notes: "Pico de eficácia dependente de níveis monitorizados (Cmax e trough). Risco ototóxico."
  },
  {
    name: "Soro Hipertónico (NaCl 3% / 7.5%)",
    category: "Neuro",
    dose: "Bolus ou perfusão em HIC (>250mL 3% ao dia ou sos).",
    renal: "Evitar em anúria absoluta pela sobrecarga.",
    hepatic: "Indiferente.",
    rrt: "Monitorizar estritamente Natremia.",
    albumin: "Irrelevante.",
    notes: "Terapêutica da Hipertensão Intracraniana via restabelecimento do gradiente osmótico. Manter CVC sempre que >=3%."
  },
  {
    name: "Cisatracúrio",
    category: "Vent",
    dose: "Bolus 0.15 mg/kg IV. Perfusão: 1 a 3 mcg/kg/min.",
    renal: "Independente - degradação de Hofmann (depende do pH e Temperatura).",
    hepatic: "Independente.",
    rrt: "Seguro. Não requer extras.",
    albumin: "Sem problema.",
    notes: "Menor libertação de histamina que atracúrio nativo."
  },
  {
    name: "Rocurónio",
    category: "Vent",
    dose: "Bolus de 0.6 a 1.2 mg/kg. Manutenção: bolus extras ou perfusão baixa.",
    renal: "T1/2 prolongada em renal grave mas pode ser usado.",
    hepatic: "Eliminação principalmente biliar/hepática - prolonga semi-vida.",
    rrt: "Sugerido ajuste de dose diário clínico.",
    albumin: "Sem efeito.",
    notes: "Bloqueador não-despolarizante reversível por Sugammadex (Bridion)."
  },
  {
    name: "Salbutamol",
    category: "Vent",
    dose: "Nas crises 2.5-5mg Bromb./Neb. ou MDI com câmara expansora.",
    renal: "Sem ajuste.",
    hepatic: "Metabolismo sem ajuste grave de broncodilatação.",
    rrt: "Igual.",
    albumin: "Igual.",
    notes: "Pode induzir taquicardia e hipocaliemia franca."
  },
  {
    name: "Milrinona",
    category: "Cardio",
    dose: "Ataque 50mcg/kg. Perfusão: 0.3 a 0.75 mcg/kg/min.",
    renal: "Obrigatório baixar perfusão em Lesão Renal ou suspender bólus (acumula).",
    hepatic: "Sem alteração.",
    rrt: "Removedor fraco, não dialisável ativamente em excesso.",
    albumin: "Moderada. 70%.",
    notes: "Inodilatador (PDE3). Reduz Pós-Carga direita. Cuidado com Hipotensão extrema."
  },
  {
    name: "Esmolol",
    category: "Cardio",
    dose: "50 a 300 mcg/kg/min em perfusão.",
    renal: "Seguro.",
    hepatic: "Metabolismo plasmático, independente do fígado.",
    rrt: "Pode ser mantido sem ajuste.",
    albumin: "Esterases sanguíneas, indiferente.",
    notes: "Ação ultra curta. Beta 1-Tópico e controlo rápido da FC em fibrilhação/flutter/taquicardia."
  },
  {
    name: "Bicarbonato de Sódio",
    category: "Renal",
    dose: "Tipicamente 1 a 2 mEq/kg bólus ou perfusão a 8.4% ou 1.4% (isotónico).",
    renal: "Terapêutica da IR, ou toxicidade. Teto restritivo de hipernatremia.",
    hepatic: "Inócuo a disfunção.",
    rrt: "Reposições são dadas via líquido dialisante (RRT).",
    albumin: "N/A",
    notes: "Vigiar e compensar rapidamente pH, não usar sem ventilação adequada face ao delta CO2 produzido."
  },
  {
    name: "Pantoprazol",
    category: "Digestivo",
    dose: "40mg 24h ou 80mg perfusão (Hemorragia Digestiva).",
    renal: "Seguro total.",
    hepatic: "Metabolismo CYP, limitar a 20mg a longo prazo em IH severa.",
    rrt: "Não dialisável (98% proteína).",
    albumin: "Forte ligação.",
    notes: "Profilaxia de Úlcera de Stress e proteção GI."
  },
  {
    name: "Metoclopramida",
    category: "Digestivo",
    dose: "10mg 8/8h IV",
    renal: "Ajustar em ClCr <40-50, reduzir a meio dose diária.",
    hepatic: "Monitorizar efeitos neurológicos secundários.",
    rrt: "Sem ajuste drástico, evitar sobre-exposição.",
    albumin: "Indiferente.",
    notes: "Risco considerável de EPS (Extrapiramidais). CI em obstrução franca."
  },
  {
    name: "Lactulose",
    category: "Digestivo",
    dose: "A dose para induzir 2 a 3 dejeções moles c/ Encefalopatia Hepática.",
    renal: "Sem absorção sistémica.",
    hepatic: "Terapia essencial na Cirrose p/ limpeza de amónia.",
    rrt: "Irrelevante.",
    albumin: "Indiferente.",
    notes: "Pode causar o íleo paralítico perante distensão. Avaliar ruídos hidroaéreos."
  },
  {
    name: "Enoxaparina (HBPM)",
    category: "Hemato",
    dose: "Profilaxia: 40mg SC 24/24. Terapia: 1mg/kg SC 12/12h.",
    renal: "Crucial! Reduzir 50% ou evitar se ClCr < 30.",
    hepatic: "Monitorizar sangramento.",
    rrt: "Perigosa por semi-vida alta com risco acumulativo sem HNF. Prefenção para heparinas fixas não fracionadas ou ajustar.",
    albumin: "Grosso peso molecular.",
    notes: "Monitorizar a-Xa se obesos (>100kg), doentes renais agudos limítrofes ou grávidas."
  },
  {
    name: "Ácido Tranexâmico",
    category: "Hemato",
    dose: "1g (ex: Crash-2: 1g bólus seguido 1g/8h) em hemorragia massiva.",
    renal: "Ajustar fortemente na Terapia Prolongada IR.",
    hepatic: "N/A",
    rrt: "Gera depuração rápida.",
    albumin: "3%.",
    notes: "Antifibrinolítico. Aplicação precoce <3h trauma. Cuidado c/ tromboembolismo."
  }
];

