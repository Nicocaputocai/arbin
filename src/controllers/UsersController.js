const User = require('../models/Users');
const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = {
  register: async function (req, res) {
    try {
      const { name, user, password, role } = req.body;

      if (!name || !user || !password || !role) {
        return res.status(400).send({ message: 'Todos los campos son obligatorios' });
      }

      const existingUser = await User.findOne({ user });
      if (existingUser) {
        return res.status(400).send({ message: 'El usuario ya está registrado' });
      }

      const newUser = new User({ name, user, password, role });
      const savedUser = await newUser.save();

      // Evitamos devolver la contraseña hasheada en la respuesta
      const userResponse = {
        id: savedUser._id,
        name: savedUser.name,
        user: savedUser.user,
        role: savedUser.role,
      };

      return res.status(201).send({
        message: 'Usuario registrado exitosamente',
        user: userResponse,
      });
    } catch (err) {
      return res.status(500).send({
        message: 'Error al registrar el usuario',
        error: err.message,
      });
    }
  },

  login: async function (req, res) {
    try {
      const secret = process.env.JWT_SECRET;
      const { user, password } = req.body;

      if (!user || !password) {
        return res.status(400).send({ message: 'Todos los campos son obligatorios' });
      }

      const foundUser = await User.findOne({ user });
      if (!foundUser) {
        return res.status(404).send({ message: 'Usuario no encontrado' });
      }

      const isMatch = await foundUser.compararContraseña(password);
      if (!isMatch) {
        return res.status(401).send({ message: 'Contraseña incorrecta' });
      }

      const payload = {
        id: foundUser._id,
        user: foundUser.user,
        name: foundUser.name,
        role: foundUser.role,
      };

      const token = jwt.sign(payload, secret, { expiresIn: '12h' });

      return res.status(200).send({
        message: 'Inicio de sesión exitoso',
        token,
        user: payload, // Útil para guardar directo en localStorage / Context en React
      });
    } catch (err) {
      console.error('Error en login:', err);
      return res.status(500).send({ message: 'Error interno al iniciar sesión', error: err.message });
    }
  },

  // Obtener lista de censistas/usuarios para el filtro del Dashboard
  getAllUsers: async function (req, res) {
    try {
      const users = await User.find({}, { password: 0 }).sort({ name: 1 });
      return res.status(200).send(users);
    } catch (err) {
      return res.status(500).send({ message: 'Error al obtener los usuarios', error: err.message });
    }
  },

  test: function (req, res) {
    return res.status(200).send({ message: 'funcionando' });
  },
};