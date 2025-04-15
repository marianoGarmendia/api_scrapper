interface CarPropsUrl {
    startYear: string,
    endYear: string,
    marca?:string,
    minPrice?:string,
    maxPrice?:string,
    modelo?:string
}

// Scrappear con la url de los autos por año
export function getUrlCarByYear({startYear, endYear}: CarPropsUrl): string {
    const url = `http://www.chileautos.cl/vehiculos/?q=(And.TipoVeh%C3%ADculo.Autos._.Ano.range(${startYear}..${endYear}).)`;
    return url;
}


// Scrappear por año y por marca y el precio
export function getUrlCarByMarcaAndYear({marca, startYear, endYear, minPrice, maxPrice}:CarPropsUrl):string{
    const url = `https://www.chileautos.cl/vehiculos/?q=(And.TipoVeh%C3%ADculo.Autos._.Marca.${marca}._.Ano.range(${startYear}..${endYear})._.Precio.range(${minPrice}..${maxPrice}).)`;
    return url;

}

export function getFullUrl({marca, startYear, endYear, minPrice, maxPrice, modelo}:CarPropsUrl){
    const url = `https://www.chileautos.cl/vehiculos/?q=(And.TipoVeh%C3%ADculo.Autos._.(C.Marca.${marca}._.Modelo.${modelo}.)_.Ano.range(${startYear}..${endYear})._.Precio.range(${minPrice}..${maxPrice}).)`;
    return url;
}


export function getUrlCarByPriceAndYear({startYear, endYear, minPrice, maxPrice}:CarPropsUrl):string{
    const url = `https://www.chileautos.cl/vehiculos/?q=(And.TipoVeh%C3%ADculo.Autos._.Ano.range(${startYear}..${endYear})._.Precio.range(${minPrice}..${maxPrice}).)`;
    return url;
}