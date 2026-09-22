cmake_minimum_required(VERSION 3.16)
project(hingesworklets)

set(CMAKE_CXX_STANDARD 20)

find_package(fbjni REQUIRED CONFIG)
find_package(ReactAndroid REQUIRED CONFIG)
find_package(react-native-worklets CONFIG QUIET)

get_filename_component(PACKAGE_ROOT "${CMAKE_CURRENT_LIST_DIR}/../../../.." ABSOLUTE)

add_library(
  hingesworklets
  SHARED
  HingesWorkletsModule.cpp
  "${PACKAGE_ROOT}/cpp/HingesWorklets.cpp")

target_include_directories(
  hingesworklets
  PRIVATE
  "${PACKAGE_ROOT}/cpp"
  "${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/react/turbomodule")

target_link_libraries(
  hingesworklets
  android
  log
  ReactAndroid::reactnative
  ReactAndroid::jsi
  fbjni::fbjni)

if(TARGET react-native-worklets::worklets)
  target_compile_definitions(hingesworklets PRIVATE HINGES_WORKLETS_ENABLED=1)
  target_link_libraries(hingesworklets react-native-worklets::worklets)
else()
  target_compile_definitions(hingesworklets PRIVATE HINGES_WORKLETS_ENABLED=0)
endif()
