const formPrediksi = document.getElementById("form-prediksi")
const inputFitur = document.querySelectorAll("#form-prediksi input")
const infoModel = document.getElementById("info-model")
const teksSpesies = document.getElementById("hasil-spesies")
const teksKeterangan = document.getElementById("hasil-keterangan")

const daftarSpesies = ["Iris-setosa", "Iris-versicolor", "Iris-virginica"]

let dataModel
let k, jumlah_train, jumlah_test, data_min, data_max, x_train, y_train

async function muatModel() {
    try {
        const respon = await fetch("model_knn.json", { cache: "no-cache" })
        dataModel = await respon.json()
        
        ({ k, jumlah_train, jumlah_test, data_min, data_max, x_train, y_train } = dataModel)
        
        tampilkanInfoModel()
    } catch (error) {
        teksKeterangan.textContent = "File model_knn.json tidak ditemukan atau gagal dimuat";
        teksKeterangan.classList.add("error");
        console.error(error);
    }
}

muatModel()

const tampilkanInfoModel = () => {
    const jumlahData = jumlah_train + jumlah_test
    const persenTest = Math.round((jumlah_test / jumlahData) * 100)
    const persenTrain = 100 - persenTest
    
    infoModel.textContent = `Train : Test = ${persenTrain}% : ${persenTest}% (K = ${k})`
}

const skalakan = (fitur) => {
    return fitur.map((nilai, i) => (nilai - data_min[i]) / (data_max[i] - data_min[i]));
}

const hitungJarak = (titikA, titikB) => {
    let jumlah = 0
    for (let i = 0; i < titikA.length; i++) {
        jumlah += (titikA[i] - titikB[i]) ** 2
    }
    return Math.sqrt(jumlah)
}

const tetanggaTerdekat = (fiturSkala) => {
    const daftarJarak = x_train.map((dataTrain, i) => ({
        jarak: hitungJarak(dataTrain, fiturSkala),
        spesies: y_train[i],
    }));
    daftarJarak.sort((a, b) => a.jarak - b.jarak)
    return daftarJarak.slice(0, k)
}

const jumlahPerSpesies = (daftarTetangga) => {
    const jumlah = {}
    for (const spesies of daftarSpesies) {
        jumlah[spesies] = 0
    }
    for (const tetangga of daftarTetangga) {
        jumlah[tetangga.spesies] += 1
    }
    return jumlah
}

const spesiesTerbanyak = (jumlah) => {
    let terbanyak = daftarSpesies[0]
    for (const spesies of daftarSpesies) {
        if (jumlah[spesies] > jumlah[terbanyak]) {
            terbanyak = spesies
        }
    }
    return terbanyak
}

const prediksiSpesies = (fitur) => {
    const fiturSkala = skalakan(fitur)
    const daftarTetangga = tetanggaTerdekat(fiturSkala)
    const jumlahPerSpecies = jumlahPerSpesies(daftarTetangga)
    const spesies = spesiesTerbanyak(jumlahPerSpecies)
    return { spesies, jumlahPerSpecies }
}

const singkatNama = (spesies) => {
    return spesies.replace("Iris-", "")
}

formPrediksi.addEventListener("submit", (e) => {
    e.preventDefault()

    if (!dataModel) {
        alert("Model belum selesai dimuat. Mohon tunggu sebentar.");
        return;
    }

    const fitur = []
    for (const input of inputFitur) {
        fitur.push(parseFloat(input.value))
    }

    const hasil = prediksiSpesies(fitur)

    const daftarJumlah = []
    for (const spesies of daftarSpesies) {
        daftarJumlah.push(`${hasil.jumlahPerSpecies[spesies]} ${singkatNama(spesies)}`)
    }

    teksSpesies.textContent = singkatNama(hasil.spesies)
    teksKeterangan.textContent = `Dari ${k} tetangga terdekat:\n${daftarJumlah.join(", ")}`
})
