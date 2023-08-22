// const { request, response } = require("express")
const detailtransaksiModel = require(`../models/index`).detail_transaksi
const transaksiModel = require(`../models/index`).transaksi
const userModel = require(`../models/index`).user
const mejaModel = require(`../models/index`).meja
const { getUserLogin } = require(`./auth.controller`)
const Op = require(`sequelize`).Op
const Sequelize = require("sequelize");
const sequelize = new Sequelize("cafe", "root", "", {
    host: "localhost",
    dialect: "mysql",
});

const db = require("../config/config")

exports.getAlltransaksi = async (request, response) => {
    let transaksi = await transaksiModel.findAll();
    return response.json({
        success: true,
        data: transaksi,
        message: `ini adalah semua data transaksi`,
    })
}

exports.getAlldetail = async (request, response) => {
    let detail = await detailtransaksiModel.findAll();
    return response.json({
        success: true,
        data: detail,
        message: `ini adalah semua data detail`,
    })
}

exports.getTransaksiById = async (request, response) => {
    const transaksiId = request.params.id; // Assuming the transaction ID is passed as a route parameter

    try {
        let transaksi = await sequelize.query(
            `SELECT transaksi.id_transaksi, transaksi.tgl_transaksi, transaksi.id_user, transaksi.id_meja, transaksi.nama_pelanggan, transaksi.status, transaksi.grandtotal , detail_transaksi.qty, menu.nama_menu, menu.harga
         FROM transaksi JOIN detail_transaksi ON transaksi.id_transaksi = detail_transaksi.id_transaksi JOIN menu ON detail_transaksi.id_menu = menu.id_menu
         WHERE transaksi.id_transaksi = :transaksiId  `,
            {
                replacements: { transaksiId },
                type: sequelize.QueryTypes.SELECT,
            }
        );

        if (transaksi.length === 0) {
            return response.status(404).json({
                success: false,
                message: 'Transaction not found',
            });
        }

        return response.json({
            success: true,
            data: transaksi[0],
            message: 'Transaction retrieved successfully',
        });
    } catch (error) {
        console.error('Error retrieving transa  ction:', error);
        return response.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
};

// exports.addtransaksi = async (request, response) => {
//     let newTransaksi = {
//         tgl_transaksi: new Date(),
//         id_user: request.body.id_user,
//         id_meja: request.body.id_meja,
//         nama_pelanggan: request.body.nama_pelanggan,
//         status: request.body.status,
//         grandtotal: request.body.grandtotal,
//         detail_transaksi: [
//             { id_menu: request.body.id_menu },
//             { qty: request.body.qty },
//         ],
//     };

//     // update status meja
//     await mejaModel.update({ status: false }, { where: { id_meja: request.body.id_meja } });

//     // insert ke tabel 
//     transaksiModel
//         .create(newTransaksi)
//         .then(async (result) => {
//             let detail_transaksi = request.body.detail_transaksi
//             // asumsinya detail_transaksi itu bertipe array
//             let id = result.id_transaksi
//             for (let i = 0; i < detail_transaksi.length; i++) {
//                 detail_transaksi[i].id_transaksi = id;
//             }

//             // insert ke tabel detail_transaksi
//             await detailtransaksiModel
//                 .bulkCreate(detail_transaksi)
//                 // create = insert 1 baris / 1 data
//                 // bulkCreate = bisa banyak data(array)
//                 .then(result => {
//                     return response.json({
//                         message: `Data transaksi berhasil ditambahkan`
//                     });
//                 })
//                 .catch(error => {
//                     return response.json({
//                         message: error.message
//                     });
//                 });
//         })
//         .catch(error => {
//             return response.json({
//                 message: error.message
//             });
//         });
// };

exports.addtransaksi = async (request, response) => {
    let newTransaksi = {
        tgl_transaksi: new Date(),
        id_user: request.body.id_user,
        id_meja: request.body.id_meja,
        nama_pelanggan: request.body.nama_pelanggan,
        status: request.body.status,
        grandtotal: request.body.grandtotal,
        detail_transaksi: [
            { id_menu: request.body.id_menu },
            { qty: request.body.qty },
        ],
    };

    // update status meja
    await mejaModel.update({ status: false }, { where: { id_meja: request.body.id_meja } });

    // insert ke tabel 
    transaksiModel
        .create(newTransaksi)
        .then(async (result) => {
            let detail_transaksi = request.body.detail_transaksi
            // asumsinya detail_transaksi itu bertipe array
            let id = result.id_transaksi
            for (let i = 0; i < detail_transaksi.length; i++) {
                detail_transaksi[i].id_transaksi = id;
            }

            // insert ke tabel detail_transaksi
            await detailtransaksiModel
                .bulkCreate(detail_transaksi)
                // create = insert 1 baris / 1 data
                // bulkCreate = bisa banyak data(array)
                .then(result => {
                    return response.json({
                        message: `Data transaksi berhasil ditambahkan`
                    });
                })
                .catch(error => {
                    return response.json({
                        message: error.message
                    });
                });
        })
        .catch(error => {
            return response.json({
                message: error.message
            });
        });
};

exports.save = async (req, res) => {
    let user = getUserLogin(req)
    let today = new Date()
    let currentDate = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()} ${today.getHours()}:${today.getMinutes()}:${today.getDay()}`
    data = {
        tgl_transaksi: currentDate,
        id_user: user.id_user,
        id_meja: req.body.id_meja,
        nama_pelanggan: req.body.nama_pelanggan,
        status: req.body.status,
        grandtotal: 0,
    }
    let response = {}

    let sql = "insert into transaksi set ?"
    db.query(sql, data, (err, result) => {
        if (err) {
            response = {
                status: false,
                message: err.message
            }
        } else {
            let id_transaksi = result.insertId
            let sukses_insert = 0;
            let total = 0;
            req.body.detail_transaksi.forEach((data) => {
                let sql = "select * from menu where ?"
                let id_menu = {
                    id_menu: data.id_menu
                }
                db.query(sql, id_menu, (err, result) => {
                    if (!err) {
                        total += result[0].harga * data.qty
                        let object = {
                            id_transaksi: id_transaksi,
                            id_menu: result[0].id_menu,
                            qty: data.qty
                        }
                        let sql = "insert into detail_transaksi set ?"
                        db.query(sql, object, (err, result) => {
                            if (result) {
                                let object = [{
                                    grandtotal: total
                                }, id_transaksi]
                                let sql = 'update transaksi set ? where id_transaksi=?'
                                db.query(sql, object, (err, result) => {
                                    if (!err) {
                                        sukses_insert++
                                    }
                                })
                            }
                        })
                    }
                })
            })
            response = {
                status: true,
                message: "sukses memasukkan data transaksi"
            }
        }
        res.json(response)
    })
}

exports.findTransaksi = async (request, response) => {
    let keyword = request.body.nama_pelanggan;
    let nama_pelanggan = await transaksiModel.findAll({
        where: {
            [Op.or]: [
                { nama_pelanggan: { [Op.substring]: keyword } }
            ],
        },
    });
    return response.json({
        success: true,
        data: nama_pelanggan,
        message: `berikut data yang anda minta`,
    });
};

exports.updatetransaksi = async (request, response) => {

    let idTransaksi = request.params.id
    let transaksi = {
        tgl_transaksi: Date(),
        id_user: request.body.id_user,
        id_meja: request.body.id_meja,
        nama_pelanggan: request.body.nama_pelanggan,
        status: request.body.status
    }
    transaksiModel.update(transaksi, { where: { id_transaksi: idTransaksi } })
        .then(result => {
            return response.json({
                success: true,
                message: `Data terupdate`,
                data: result
            })
        })
        .catch(error => {
            return response.json({
                success: false,
                message: error.message,
            })
        })
}


exports.deletetransaksi = async (request, response) => {
    let idtransaksi = request.params.id

    transaksiModel.destroy({ where: { id_transaksi: idtransaksi } })
        .then(result => {
            return response.json({
                success: true,
                message: `Data tipe transaksi has been deleted`
            })
        })
        .catch(error => {
            return response.json({
                success: false,
                message: error.message
            })
        })
}

// exports.getStat = async (request, response) => {
//     let transaksi = await transaksiModel.findAll();
//     return response.json({
//         success: true,
//         data: transaksi,
//         message: `ini adalah semua data transaksi`,
//     })
// }

// exports.getdetaillaporan = async (req, res) => {
//     let sql = "select * from detail_transaksi join menu on menu.id_menu = detail_transaksi.id_menu where id_transaksi = '" + req.params.id + "'"
//     db.query(sql, (error, result) => {
//         let response = null
//         if (error) {
//             response = {
//                 message: error.message // pesan error
//             }
//         } else {
//             response = {
//                 count: result.length, // jumlah data
//                 data: result // isi data
//             }
//         }
//         return res.json(response) // send response
//     })
// }
