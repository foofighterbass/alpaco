# Specifying the base image
FROM node:12

# Installing the working directory in the container
WORKDIR /app

# Copying the package.json and package-lock.json to container
COPY package*.json ./

# Installing dependencies
RUN npm install

# Copy all the project files to the container
COPY . .

# We determine the port on which the application will run
EXPOSE 3000

# Run the command to launch the application
CMD [ "npm", "start" ]