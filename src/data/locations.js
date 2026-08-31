// Bairros de Teresina-PI (~123, agrupados por zona/SDU) via Wikipédia
// (https://pt.wikipedia.org/wiki/Lista_de_bairros_de_Teresina) e de Timon-MA
// via diretório de CEPs (https://cepbrasil.org/maranhao/timon/).
// PetMatch é focado nessas duas cidades — ver plano, Fase 5.

const TERESINA_NEIGHBORHOODS = [
  // Zona Centro
  'Cabral', 'Centro (Norte)', 'Centro (Sul)', 'Frei Serafim', 'Ilhotas', 'Mafuá', 'Marquês', 'Matinha', 'Piçarra', 'Porenquanto',
  // Zona Norte
  'Acarape', 'Aeroporto', 'Água Mineral', 'Alto Alegre', 'Aroeiras', 'Bom Jesus', 'Buenos Aires', 'Chapadinha', 'Cidade Industrial', 'Embrapa', 'Itaperu', 'Jacinta Andrade', 'Mafrense', 'Matadouro', 'Memorare', 'Mocambinho', 'Monte Verde', 'Morro da Esperança', 'Nova Brasília', 'Olarias', 'Parque Alvorada', 'Parque Brasil', 'Poti Velho', 'Primavera', 'Real Copagre', 'Santa Maria da Codipi', 'Santa Rosa', 'Santa Sofia', 'São Joaquim', 'Vila Operária', 'Vila São Francisco',
  // Zona Sul
  'Angelim', 'Angélica', 'Areias', 'Bela Vista', 'Brasilar', 'Catarina', 'Cidade Nova', 'Cristo Rei', 'Distrito Industrial', 'Esplanada', 'Lourival Parente', 'Macaúba', 'Monte Castelo', 'Morada Nova', 'Nossa Senhora das Graças', 'Parque Jacinta', 'Parque Juliana', 'Parque Piauí', 'Parque São João', 'Parque Sul', 'Pedra Miúda', 'Pio XII', 'Portal da Alegria', 'Promorar', 'Redenção', 'Saci', 'Santa Cruz', 'Santa Luzia', 'Santo Antônio', 'São Lourenço', 'São Pedro', 'Tabuleta', 'Três Andares', 'Triunfo', 'Vermelha',
  // Zona Leste
  'Árvores Verdes', 'Campestre', 'Cidade Jardim', 'Fátima', 'Horto', 'Ininga', 'Jockey', 'Morada do Sol', 'Morros', 'Noivos', 'Novo Uruguai', 'Parque Universitário', 'Pedra Mole', 'Piçarreira', 'Planalto', 'Planalto Uruguai', 'Porto do Centro', 'Recanto das Palmeiras', 'Samapi', 'Santa Isabel', 'Santa Lia', 'São Cristóvão', 'São João', 'Satélite', 'Socopo', 'Tabajaras', 'Uruguai', 'Vale do Gavião', 'Vale Quem Tem', 'Verde Lar', 'Vila Santa Bárbara', 'Vila Uruguai', 'Zoobotânico',
  // Zona Sudeste
  'Beira Rio', 'Bom Princípio', 'Colorado', 'Comprida', 'Dirceu Arcoverde', 'Extrema', 'Flor do Campo', 'Gurupi', 'Itararé', 'Livramento', 'Novo Horizonte', 'Parque Ideal', 'Parque Poti', 'Redonda', 'Renascença', 'Santana', 'São Raimundo', 'São Sebastião', 'Tancredo Neves', 'Todos os Santos', 'Verde Cap',
].sort((a, b) => a.localeCompare(b, 'pt-BR'))

const TIMON_NEIGHBORHOODS = [
  'Baixa do Côco', 'Bela Vista', 'Boa Esperança', 'Boa Vista', 'Cajueiro', 'Centro', 'Cícero Ferraz', 'Cidade Industrial Norte', 'Cidade Nova', 'Flores', 'Flores I', 'Formosa', 'Glória', 'Guarita', 'Jóia', 'Mangal', 'Mangueira', 'Marimar', 'Mateuzinho', 'Mutirão', 'Parque Aliança', 'Parque Alvorada', 'Parque Piauí', 'Parque União', 'Pedro Patrício', 'Planalto Boa Esperança', 'Planalto Formosa', 'Santo Antônio', 'São Benedito', 'São Francisco I', 'São Francisco II', 'São Marcos', 'Sete Estrelas', 'Vila Angélica', 'Vila Bandeirante', 'Vila Bandeirante II', 'Vila Monteiro', 'Zona Rural',
].sort((a, b) => a.localeCompare(b, 'pt-BR'))

export const CITIES = [
  { value: 'Teresina, PI', neighborhoods: TERESINA_NEIGHBORHOODS },
  { value: 'Timon, MA', neighborhoods: TIMON_NEIGHBORHOODS },
]

export function neighborhoodsForCity(city) {
  return CITIES.find((c) => c.value === city)?.neighborhoods ?? []
}
