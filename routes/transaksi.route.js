const express = require(`express`)
const app = express()

app.use(express.json())

// call transaksiController
let transaksiController = require("../controller/transaksi.controller")
const auth = require(`../controller/auth.controller`)

// endpoint get data transaksi
app.get("/", auth.authVerify, transaksiController.getAlltransaksi)
app.get("/:id", auth.authVerify, transaksiController.getTransaksiById)
app.get("/detail", auth.authVerify, transaksiController.getAlldetail)
app.post("/", auth.authVerify, transaksiController.addtransaksi)
app.post("/save", auth.authVerify, transaksiController.save)
app.post("/find", auth.authVerify, transaksiController.findTransaksi)
app.put("/:id", auth.authVerify, transaksiController.updatetransaksi)
app.delete("/:id", auth.authVerify, transaksiController.deletetransaksi)
// app.get("/stat", auth.authVerify, transaksiController.getStat)
// app.get("/laporan/:id", auth.authVerify, transaksiController.getdetaillaporan)

module.exports = app